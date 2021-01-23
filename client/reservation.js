const RESERVATION = (() => {
    // Save reservation return code from server
    const RETURN_CODE = {
        SUCCESS: 0,
        ROOM_NOT_AVAILABLE: 1,
        INVALID_PERIOD: 2,
        PERIOD_LARGER_THAN_24_HOURS: 3,
        INVALID_TOKEN: 4,
        USER_NOT_FOUND: 5,
        USER_TOKEN_MISMATCH: 6,
        RESERVATION_NOT_FOUND: 7,
        NOT_AUTHORIZED: 8,
        DB_ERROR: 9,
    };

    /**
     * Load the reservation data by ID
     */
    const getReservationById = async (reservationId) => {
        let theReservation = await GRAPHQL.getOneReservation(reservationId);
        if (theReservation) {
            theReservation.fromDate = theReservation.from.substring(0, 10);
            theReservation.fromTime = theReservation.from.substring(11);
            theReservation.toDate = theReservation.to.substring(0, 10);
            theReservation.toTime = theReservation.to.substring(11);
            theReservation.mentionUsers = "";
            theReservation.mention.forEach((mention) => {
                const mentionUser = MMR.users.find(
                    ({ userId }) => userId === mention
                );
                if (mentionUser) {
                    theReservation.mentionUsers += `@${mentionUser.userId} `;
                }
            });
        }
        return theReservation;
    };

    /**
     * Show error on dialog and focus error element
     * @param {*} vue VUE Object
     * @param {*} errorMessageKey Key of the error message
     * @param {*} focusElement Move focus to target element when provided
     */
    const showErrorAndFocus = (vue, errorMessageKey, focusElement) => {
        vue.DATA.error = MMR.currentLangResource[errorMessageKey];
        vue.$forceUpdate();
        if (focusElement) {
            focusElement.focus();
        }
    };

    /**
     * Check server operation result and show error if there was some error
     * @param {*} result Server result code
     * @param {*} vue VUE object
     */
    const checkServerResult = (result, vue) => {
        let returnValue = false;
        switch (result) {
            case RETURN_CODE.SUCCESS:
                returnValue = true;
                break;
            case RETURN_CODE.ROOM_NOT_AVAILABLE:
                showErrorAndFocus(
                    vue,
                    "errorRoomNotAvailable",
                    vue.$refs.fromDate
                );
                break;
            case RETURN_CODE.INVALID_PERIOD:
                showErrorAndFocus(
                    vue,
                    "errorInvalidTermDate",
                    vue.$refs.fromDate
                );
                break;
            case RETURN_CODE.PERIOD_LARGER_THAN_24_HOURS:
                showErrorAndFocus(
                    vue,
                    "errorTermTooLongForReserve",
                    vue.$refs.fromDate
                );
                break;
            case RETURN_CODE.INVALID_TOKEN:
                showErrorAndFocus(vue, "errorInvalidToken");
                break;
            case RETURN_CODE.USER_NOT_FOUND:
                showErrorAndFocus(vue, "errorUserNotFound");
                break;
            case RETURN_CODE.USER_TOKEN_MISMATCH:
                showErrorAndFocus(vue, "errorUserTokenMismatch");
                break;
            case RETURN_CODE.RESERVATION_NOT_FOUND:
                showErrorAndFocus(vue, "errorReservationNotFound");
                break;
            case RETURN_CODE.NOT_AUTHORIZED:
                showErrorAndFocus(vue, "errorNotAuthorized");
                break;
            case RETURN_CODE.DB_ERROR:
                showErrorAndFocus(vue, "errorUnknown");
                break;
        }
        return returnValue;
    };

    /**
     * Save reservation
     * @param {*} reservationId Reservation ID, undefined when saving new item
     * @param {*} vue Vue object containing the data
     */
    const saveReservation = async (reservationId, vue) => {
        const {
            roomId,
            fromDate,
            toDate,
            fromTime,
            toTime,
            purpose,
            comment,
            mentionUsers,
        } = vue.DATA;

        // Check required items
        if (!fromDate || !toDate) {
            if (!fromDate) {
                showErrorAndFocus(vue, "errorRequired", vue.$refs.fromDate);
            } else {
                showErrorAndFocus(vue, "errorRequired", vue.$refs.toDate);
            }
            return false;
        }

        // Check if the mentioned user exists
        let mentionConvert = [];
        if (mentionUsers) {
            let mentionError = false;
            const mentionUsersWithoutSpace = mentionUsers.trim();
            mentionUsersWithoutSpace.split(" ").forEach((mention) => {
                const mentionUserId = mention.replace("@", "");
                const user = MMR.users.find(
                    ({ userId }) => userId === mentionUserId
                );
                if (!user) {
                    showErrorAndFocus(vue, "errorMention", vue.$refs.mention);
                    mentionError = true;
                    return false;
                }
                mentionConvert.push(mentionUserId);
            });
            if (mentionError) {
                return false;
            }
        }
        vue.DATA.mention = mentionConvert;

        // Validation check
        const fromDateValue = new Date(fromDate);
        const toDateValue = new Date(toDate);
        if (isNaN(fromDateValue.getTime())) {
            showErrorAndFocus(vue, "errorInvalidDate", vue.$refs.fromDate);
            return false;
        }
        if (isNaN(toDateValue.getTime())) {
            showErrorAndFocus(vue, "errorInvalidDate", vue.$refs.toDate);
            return false;
        }

        // Term check
        const from = `${fromDate} ${fromTime}`;
        const to = `${toDate} ${toTime}`;
        const fromDatetime = new Date(from);
        const toDatetime = new Date(to);
        const term = toDatetime.getTime() - fromDatetime.getTime();
        if (term <= 0) {
            showErrorAndFocus(vue, "errorInvalidTermDate", vue.$refs.fromDate);
            return false;
        }
        if (term > 24 * 60 * 60 * 1000) {
            // The term is larger than 24 hours
            showErrorAndFocus(
                vue,
                "errorTermTooLongForReserve",
                vue.$refs.fromDate
            );
            return false;
        }

        // Passed the basic validation check, submit data to the server and try to save
        const result = await GRAPHQL.saveReservation({
            reservationId,
            user: MMR.currentUserID,
            from,
            to,
            roomId,
            purpose,
            comment,
            mention: mentionConvert,
        });

        // Check server return code show error if the operation failed
        return checkServerResult(result, vue);
    };

    /**
     * Edit reservation
     * @param {*} param Use the reservationId when editing an existing reservation, Otherwise use from~roomName
     */
    const editReservation = async ({
        reservationId,
        from,
        to,
        roomId,
        roomName,
        user,
    }) => {
        let reservationData = {};
        let title = "";
        let readOnly = false;
        let reservedBy = "";
        let isMyReservation = false;
        if (reservationId) {
            // Edit existing reservation
            // Fetch data from server
            reservationData = await getReservationById(reservationId);
            if (!reservationData) {
                Swal.fire(MMR.currentLangResource.errorUnknown, "", "error");
                return;
            }
            if (user === MMR.currentUserID) {
                title = MMR.currentLangResource.editTitle;
                isMyReservation = true;
            } else {
                readOnly = true;
                reservedBy = reservationData.user;
                const reservedByName = MMR.users.find(
                    ({ userId }) => userId === reservedBy
                );
                if (reservedByName) {
                    reservedBy += `:${reservedByName.userName}`;
                }
                title = MMR.currentLangResource.viewTitle;
            }
        } else {
            // New reservation
            reservationData.fromDate = from.substring(0, 10);
            reservationData.fromTime = from.substring(11);
            reservationData.toDate = to.substring(0, 10);
            reservationData.toTime = to.substring(11);
            reservationData.from = from;
            reservationData.to = to;
            reservationData.roomId = roomId;
            reservationData.roomName = roomName;
            reservationData.purpose = "meeting";
            title = MMR.currentLangResource.newTitle;
        }
        reservationData.error = "";

        // Load dialog contents from separated HTML
        const response = await fetch("./reservation.html");
        if (!response.ok) {
            // Could not load the HTML, Rare case, log the error and stop
            console.log(
                `Failed to load edit reservation dialog contents. error status: ${response.status}`
            );
            return;
        }
        const html = await response.text();
        let vue = null;

        // Popup edit dialog
        const sweetAlert = Swal.fire({
            title: title,
            html: html,
            width: 600,
            backdrop: true,
            allowOutsideClick: false,
            showCancelButton: true,
            showConfirmButton: !readOnly,
            focusConfirm: false,
            background: "#fafafa",
            confirmButtonColor: "#057DCB",
            cancelButtonColor: "#E67E22",
            confirmButtonText: MMR.currentLangResource.saveButtonText,
            cancelButtonText: readOnly
                ? MMR.currentLangResource.closeButtonText
                : MMR.currentLangResource.cancelButtonText,
            showClass: {
                popup: "swal2-noanimation",
                backdrop: "swal2-noanimation",
            },
            hideClass: {
                popup: "",
                backdrop: "",
            },
            /**
             * Validation input and submit
             */
            preConfirm: () => {
                return saveReservation(reservationId, vue);
            },
            onBeforeOpen: () => {
                // Initialize Vue
                vue = new Vue({
                    el: "#edit-reservation-popup",
                    data: {
                        MMR_LANG: MMR.currentLangResource,
                        DATA: reservationData,
                        timeOptions: MMR.timeSelectOptions15minute(),
                        disabled: readOnly,
                        reservedBy,
                        isMyReservation,
                    },
                    methods: {
                        /**
                         * clear error when editing
                         */
                        updateInput: function () {
                            this.DATA.toDate = this.DATA.fromDate;
                            this.DATA.error = "";
                            this.$forceUpdate();
                        },
                        onSubmit: function (event) {
                            // Submit manually so prevent default submit
                            event.preventDefault();
                            // Close dialog
                            Swal.clickConfirm();
                        },
                        deleteMe: async function (event) {
                            // Disable form auto submission
                            event.preventDefault();
                            // Delete record
                            const serverResult = await GRAPHQL.deleteReservation(
                                reservationId
                            );
                            if (checkServerResult(serverResult, this)) {
                                // Close dialog
                                Swal.close();
                            }
                        },
                        onEnter: function () {
                            Swal.clickConfirm();
                        },
                    },
                });

                if (!readOnly) {
                    // Register calendar popup controller etc
                    MMR.prepareCalendarEvents();

                    // Use Tribute to implements @mention
                    let tribute = new Tribute({
                        values: MMR.users,
                        selectTemplate: function (item) {
                            return "@" + item.original.key;
                        },
                        menuItemTemplate: function (item) {
                            return item.original.value;
                        },
                    });
                    tribute.attach(document.querySelector("#mention"));
                }
            },
            onOpen: () => {
                vue.$refs.fromDate.focus();
            },
        });

        const result = await sweetAlert;
        if (result.value) {
            // Save
            MMR.showNotification(
                MMR.currentLangResource.editSuccessTitle,
                "success"
            );
            return true;
        } else if (result.isDismissed && result.dismiss !== "cancel") {
            // Delete
            MMR.showNotification(
                MMR.currentLangResource.deleteSuccessTitle,
                "success"
            );
            return true;
        }
        return false;
    };

    /**
     * Delete reservation
     * @param {*} param Use reservationId
     */
    const deleteReservation = async ({ reservationId }) => {
        const sweetAlert = Swal.fire({
            title: MMR.currentLangResource.deleteTitle,
            text: "",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#057DCB",
            cancelButtonColor: "#E67E22",
            confirmButtonText: MMR.currentLangResource.deleteButtonText,
            cancelButtonText: MMR.currentLangResource.cancelButtonText,
            showClass: {
                popup: "swal2-noanimation",
                backdrop: "swal2-noanimation",
            },
            hideClass: {
                popup: "",
                backdrop: "",
            },
        });

        let returnValue = false;
        const result = await sweetAlert;
        if (result.value) {
            // Yes, delete it
            const serverResult = await GRAPHQL.deleteReservation(reservationId);

            // Check server return code show error if the operation failed
            switch (serverResult) {
                case RETURN_CODE.SUCCESS:
                    MMR.showNotification(
                        MMR.currentLangResource.deleteSuccessTitle,
                        "success"
                    );
                    returnValue = true;
                    break;
                case RETURN_CODE.INVALID_TOKEN:
                    MMR.showNotification(
                        MMR.currentLangResource.errorInvalidToken,
                        "error"
                    );
                    break;
                case RETURN_CODE.USER_NOT_FOUND:
                    MMR.showNotification(
                        MMR.currentLangResource.errorUserNotFound,
                        "error"
                    );
                    break;
                case RETURN_CODE.USER_TOKEN_MISMATCH:
                    MMR.showNotification(
                        MMR.currentLangResource.errorUserTokenMismatch,
                        "error"
                    );
                    break;
                case RETURN_CODE.RESERVATION_NOT_FOUND:
                    MMR.showNotification(
                        MMR.currentLangResource.errorReservationNotFound,
                        "error"
                    );
                    break;
                case RETURN_CODE.NOT_AUTHORIZED:
                    MMR.showNotification(
                        MMR.currentLangResource.errorNotAuthorized,
                        "error"
                    );
                    break;
                case RETURN_CODE.DB_ERROR:
                    MMR.showNotification(
                        MMR.currentLangResource.errorUnknown,
                        "error"
                    );
                    break;
            }
        }
        return returnValue;
    };

    // Expose basic functions to the outside world
    return {
        editReservation,
        deleteReservation,
    };
})();
