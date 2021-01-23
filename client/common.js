const MMR = {};

MMR.padToTwo = (number) => (number <= 99 ? `0${number}`.slice(-2) : number);

MMR.showElement = (elementId, displayType = "block") => {
    const element = document.querySelector(`#${elementId}`);
    element.style.display = displayType;
};

MMR.hideElement = (elementId) => {
    const element = document.querySelector(`#${elementId}`);
    element.style.display = "none";
};

MMR.closeSettings = () => {
    MMR.hideElement("popup-blocker");
    MMR.hideElement("settings");
};

MMR.getGreetingMessage = () => {
    let message = "";
    const hour = new Date().getHours();
    if (hour < 12) {
        message = MMR.currentLangResource.goodMorning;
    } else if (hour >= 12 && hour <= 17) {
        message = MMR.currentLangResource.goodAfternoon;
    } else {
        message = MMR.currentLangResource.goodEvening;
    }
    return message;
};

MMR.saveSettings = () => {
    localStorage.setItem("currentLangID", MMR.currentLangID);
};

/**
 * Format: yyyy/MM/dd HH:mm
 * @param {*} date the date object
 */
MMR.formatDateFull = (date) => {
    return `${date.getFullYear()}/${MMR.padToTwo(
        date.getMonth() + 1
    )}/${MMR.padToTwo(date.getDate())} ${MMR.padToTwo(
        date.getHours()
    )}:${MMR.padToTwo(date.getMinutes())}`;
};

/**
 * Format: yyyyMMdd
 * @param {*} date the date object
 */
MMR.formatDateSimple = (date) => {
    return `${date.getFullYear()}${MMR.padToTwo(
        date.getMonth() + 1
    )}${MMR.padToTwo(date.getDate())}`;
};
/**
 * Format: yyyy/MM/dd
 * @param {*} date the date object
 */
MMR.formatDate = (date) => {
    return `${date.getFullYear()}/${MMR.padToTwo(
        date.getMonth() + 1
    )}/${MMR.padToTwo(date.getDate())}`;
};

/**
 * Format: MM/dd
 * @param {*} date the date object
 */
MMR.formatDateShort = (date) => {
    return `${MMR.padToTwo(date.getMonth() + 1)}/${MMR.padToTwo(
        date.getDate()
    )}`;
};

/**
 * Format: HH:mm
 * @param {*} date the date object
 */
MMR.formatTime = (date) => {
    return `${MMR.padToTwo(date.getHours())}:${MMR.padToTwo(
        date.getMinutes()
    )}`;
};

/**
 * Format: HH
 * @param {*} date the date object
 */
MMR.formatHour = (date) => {
    return `${MMR.padToTwo(date.getHours())}`;
};

/**
 * Format: mm
 * @param {*} date the date object
 */
MMR.formatMinute = (date) => {
    return `${MMR.padToTwo(date.getMinutes())}`;
};

/**
 * Round the given date to nearest X minute
 * @param {*} date the date object
 * @param {*} minute the minute value to round to
 */
MMR.roundUpDate = (date, minute) => {
    if (minute < 0 || minute > 60) {
        minute = 0;
    }
    const coeff = 1000 * 60 * minute;
    return new Date(Math.ceil(date.getTime() / coeff) * coeff);
};

/**
 * Round the given date to previous X minute
 * @param {*} date the date object
 * @param {*} minute the minute value to round to
 */
MMR.roundDownDate = (date, minute) => {
    if (minute < 0 || minute > 60) {
        minute = 0;
    }
    const coeff = 1000 * 60 * minute;
    return new Date(Math.floor(date.getTime() / coeff) * coeff);
};

/**
 * Create new date object from given time string
 * @param {*} time the time string (HH:mm)
 */
MMR.createDateFromString = (time) => {
    let now = new Date();
    now.setHours(time.substring(0, 2) - 0);
    now.setMinutes(time.substring(2) - 0);
    return now;
};

/**
 * Get current user's reservations
 */
MMR.loadMyReservations = async () => {
    const now = new Date();
    const from = MMR.formatDateFull(now);

    return await GRAPHQL.getReservations(MMR.currentUserID, from);
};

/**
 * Get all rooms that available for the next 1 hour
 */
MMR.loadAvailableRooms = async () => {
    // Get all reservations for next hour
    // Round the starting time to the nearest 15 minute
    const fromDate = MMR.roundUpDate(new Date(), 15);
    const toDate = new Date(fromDate.getTime() + 60 * 60000);
    const from = MMR.formatDateFull(fromDate);
    const to = MMR.formatDateFull(toDate);
    const reservations = await GRAPHQL.getReservationsStatus(from, to);
    let reserved = {};
    if (reservations) {
        reservations.forEach((reservation) => {
            reserved[reservation.roomId] = true;
        });
    }

    const time = `${MMR.padToTwo(fromDate.getHours())}:${MMR.padToTwo(
        fromDate.getMinutes()
    )} - ${MMR.padToTwo(toDate.getHours())}:${MMR.padToTwo(
        toDate.getMinutes()
    )}`;

    // Loop through all rooms to get the available rooms
    let availableRooms = [];
    const rooms = await GRAPHQL.getRooms(null);
    rooms.forEach((room) => {
        const roomId = room.roomId;
        if (!reserved[roomId]) {
            availableRooms.push({
                roomId,
                time,
                from,
                to,
                roomName: room.roomName,
            });
        }
    });
    return availableRooms;
};

/**
 * Create time select box options (interval: 1 hour)
 */
MMR.timeSelectOptions1hour = () => {
    let timeOptions = [];
    Array.from({ length: 24 }, (x, hour) => {
        timeOptions.push(`${MMR.padToTwo(hour)}:00`);
    });
    return timeOptions;
};

/**
 * Create time select box options (interval: 15 minutes)
 */
MMR.timeSelectOptions15minute = () => {
    let timeOptions = [];
    Array.from({ length: 24 }, (x, hour) => {
        Array.from({ length: 4 }, (y, minute) => {
            timeOptions.push(
                `${MMR.padToTwo(hour)}:${MMR.padToTwo(minute * 15)}`
            );
        });
    });
    return timeOptions;
};

MMR.closeCalendar = () => {
    const calendarDiv = document.querySelector("#calendar-container");
    calendarDiv.parentElement.removeChild(calendarDiv);
};

/**
 * Show notification
 * @param {*} message Notification message
 * @param {*} icon Notification icon (success, error etc)
 */
MMR.showNotification = (message, icon) => {
    Swal.fire({
        title: message,
        backdrop: false,
        allowOutsideClick: false,
        html: "",
        icon: icon,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 1500,
    });
};

/**
 * Prepare calendar popup controller and date input formatter
 */
MMR.prepareCalendarEvents = () => {
    // Register date input formatter
    document.querySelectorAll(".input-date").forEach((element) => {
        var cleave = new Cleave(element, {
            date: true,
            delimiter: "/",
            datePattern: ["Y", "m", "d"],
        });
    });

    // Register calendar popup event
    document.querySelectorAll(".calendar-icon").forEach((element) => {
        if (!element.classList.contains("calendar-disabled")) {
            element.addEventListener("click", (event) => {
                const parentDiv = event.target.closest(".calendar-input");
                const dateInput = event.target.previousElementSibling;
                dateInput.focus();
                let initialValue = new Date();
                if (dateInput.value) {
                    // Try to parse current value as a Date object and ignore error
                    try {
                        initialValue = new Date(dateInput.value);
                    } catch (error) {
                        initialValue = new Date();
                    }
                }

                let calendarDiv = document.createElement("div");
                calendarDiv.id = "calendar-container";
                calendarDiv.innerHTML = `
                        <div class="popup-blocker" onclick="MMR.closeCalendar()" style="display: block"></div>
                        <div id="calendar" class="vanilla-calendar custom-calendar"></div>`;
                parentDiv.appendChild(calendarDiv);
                const vanillaCalendar = new VanillaCalendar({
                    selector: "#calendar",
                    date: new Date(initialValue.getTime()),
                    todaysDate: new Date(initialValue.getTime()),
                    onSelect: (data, elem) => {
                        const date = new Date(data.date);
                        dateInput.value = `${date.getFullYear()}/${MMR.padToTwo(
                            date.getMonth() + 1
                        )}/${MMR.padToTwo(date.getDate())}`;
                        MMR.closeCalendar();

                        // Fire the input element's 'change' event to notify Vue
                        var event = new Event("change");
                        dateInput.dispatchEvent(event);
                        dateInput.focus();
                    },
                });
            });
        }
    });
};

// Update Drift widget locale settings after language changes
MMR.updateDrift = () => {
    if (!drift) {
        return;
    }
    drift.config({
        locale: MMR.currentLangID,
        messages: {
            welcomeMessage: MMR.currentLangResource.driftWelcomeMessage,
            awayMessage: MMR.currentLangResource.driftAwayMessage,
        },
    });
};
