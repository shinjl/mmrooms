(async () => {
    /**
     * Load the news content from server and show in popup dialog
     * @param {*} newsId News unique ID
     */
    const showNewsDetail = async (newsId) => {
        const newsDetail = await GRAPHQL.getNewsContent(newsId);
        if (!newsDetail) {
            Swal.fire(MMR.currentLangResource.errorUnknown, "", "error");
            return;
        }

        const showLoading = newsDetail.showLoading;
        const credit = newsDetail.credit;
        const newsWindowWidth = newsDetail.width - 0;
        const random = new Date().getTime();
        const newsContent = `
            <div class="news-issued">${newsDetail.issued}</div>
            <div class="news-content">${newsDetail.content.replace(
                "__R_A_N_D_O_M__",
                random
            )}</div>
            <div id="news-source" class="news-source" style="display: none;">${credit}</div>
        `;
        Swal.fire({
            title: newsDetail.title,
            html: newsContent,
            width: newsWindowWidth,
            backdrop: true,
            allowOutsideClick: true,
            showCancelButton: false,
            focusConfirm: false,
            background: "#fafafa",
            confirmButtonColor: "#057DCB",
            cancelButtonColor: "#E67E22",
            confirmButtonText: MMR.currentLangResource.closeButtonText,
            showClass: {
                popup: "swal2-noanimation",
                backdrop: "swal2-noanimation",
            },
            hideClass: {
                popup: "",
                backdrop: "",
            },
            onBeforeOpen: () => {
                if (showLoading) {
                    Swal.showLoading();
                    const newsItemElement = document.querySelector(
                        "#news-item"
                    );
                    newsItemElement.onload = () => {
                        Swal.hideLoading();
                        if (credit) {
                            document.querySelector(
                                "#news-source"
                            ).style.display = "block";
                        }
                    };
                }
            },
        }).then((result) => {
            // Do nothing
        });
    };

    const addEditEventListers = () => {
        // New/Edit/Delete reservation event
        const editEvents = [
            {
                clazz: ".new-reservation",
                func: RESERVATION.editReservation,
            },
            {
                clazz: ".edit-reservation",
                func: RESERVATION.editReservation,
            },
            {
                clazz: ".delete-reservation",
                func: RESERVATION.deleteReservation,
            },
        ];
        editEvents.forEach((eventTrigger) => {
            const editEventListener = async (event) => {
                const listItem = event.target.closest(".list-item");
                // when edit/delete existing record, use reservationId
                const reservationId = listItem.getAttribute("reservationId");
                const roomId = listItem.getAttribute("roomId");
                const from = listItem.getAttribute("from");
                const to = listItem.getAttribute("to");
                const roomName = listItem.getAttribute("roomName");
                const success = await eventTrigger.func({
                    reservationId,
                    from,
                    to,
                    roomId,
                    roomName,
                    user: MMR.currentUserID,
                });
                if (success) {
                    await topVue.reload("both");
                    addEditEventListers();
                }
            };

            const elements = document.querySelectorAll(eventTrigger.clazz);
            elements.forEach((element) => {
                element.removeEventListener("click", editEventListener);
                element.addEventListener("click", editEventListener);
            });
        });
    };

    // Get all user info from DB and keep it in memory for mention selector
    MMR.users = await GRAPHQL.getUsers();

    // Get user detail info by ID
    const getUserDetail = (userId) => {
        return MMR.users.find((user) => user.userId === userId);
    };

    // For test purpose, select user randomly for first time and keep it in localStorage
    // --------------------------------------------------------------------------
    MMR.currentUserID = "";
    const existingUserId = localStorage.getItem("currentUserID");
    const existingToken = localStorage.getItem("token");
    if (existingUserId && existingToken) {
        const userInfo = getUserDetail(existingUserId);
        if (userInfo) {
            MMR.currentUserID = existingUserId;
            MMR.currentUserName = userInfo.userName;
            MMR.token = existingToken;
        }
    }
    if (!MMR.currentUserID) {
        // Request a random user ID
        const newUser = await GRAPHQL.getLoginUser();
        if (newUser) {
            const userInfo = getUserDetail(newUser.userId);
            if (userInfo) {
                MMR.currentUserID = newUser.userId;
                MMR.currentUserName = userInfo.userName;
                MMR.token = newUser.token;
                localStorage.setItem("currentUserID", MMR.currentUserID);
                localStorage.setItem("token", MMR.token);
            }
        }
    }
    if (!MMR.currentUserID) {
        MMR.showNotification(
            "Failed to get login user, please try again later.",
            "error"
        );
        return;
    }
    // --------------------------------------------------------------------------

    // Set default language resource
    MMR.currentLangResource = MMR.lang[MMR.currentLangID];

    // Get all reservations of current user
    const myReservations = await MMR.loadMyReservations();
    // Get all available rooms for now
    const availableNow = await MMR.loadAvailableRooms();
    // Get all news
    const news = await GRAPHQL.getNews();

    // The VUE object of details page, used for reloading
    let detailsVue = null;

    // Initialize top page VUE object
    const topVue = new Vue({
        el: "#app",
        data: {
            selectedLang: MMR.currentLangID,
            greeting: MMR.getGreetingMessage(),
            currentUserName: MMR.currentUserName,
            MMR_LANG: MMR.currentLangResource,
            myReservations: myReservations,
            availableNow: availableNow,
            news: news,
        },
        // arrow function does not work properly inside methods because of 'this' pointed to the different object
        methods: {
            // Check form before submit,
            changeLang: async function (event) {
                // Change language settings
                MMR.currentLangID = this.selectedLang;
                MMR.currentLangResource = MMR.lang[MMR.currentLangID];

                // Refresh user data
                MMR.users = await GRAPHQL.getUsers();

                // Replace language resources
                this.MMR_LANG = MMR.currentLangResource;

                // Generate new greeting message
                this.greeting = MMR.getGreetingMessage();
                const userInfo = getUserDetail(MMR.currentUserID);
                if (userInfo) {
                    MMR.currentUserName = userInfo.userName;
                }
                this.currentUserName = MMR.currentUserName;

                // Save current settings & close setting dialog
                MMR.saveSettings();
                MMR.closeSettings();

                if (detailsVue) {
                    // Refresh the detail page contents if exist
                    detailsVue.reload();
                } else {
                    // Refresh MyReservation/AvailableRooms/News
                    this.myReservations = await MMR.loadMyReservations();
                    this.availableNow = await MMR.loadAvailableRooms();
                    this.news = await GRAPHQL.getNews();
                }

                // Update Drift configurations
                MMR.updateDrift();
            },
            reload: async function (target) {
                switch (target) {
                    case "both":
                        // Refresh both of the reservation and the available room list
                        this.myReservations = await MMR.loadMyReservations();
                        this.availableNow = await MMR.loadAvailableRooms();
                        break;

                    case "reservations":
                        // Refresh the reservation list
                        this.myReservations = await MMR.loadMyReservations();
                        break;

                    case "available":
                        // Refresh the available room list
                        this.availableNow = await MMR.loadAvailableRooms();
                        break;

                    case "news":
                        // Refresh the news list
                        this.news = await GRAPHQL.getNews();
                        break;
                }
            },
        },
    });

    // Show contents after Vue initialization
    MMR.showElement("app", "flex");

    // User settings
    document
        .querySelector("#setting-button")
        .addEventListener("click", (event) => {
            MMR.showElement("popup-blocker");
            MMR.showElement("settings");
        });

    // Edit/Delete/New reservation event
    addEditEventListers();

    // Show news detail event
    const newsDetailIcons = document.querySelectorAll(".news-detail");
    newsDetailIcons.forEach((element) => {
        element.addEventListener("click", (event) => {
            const listItem = event.target.closest(".list-item");
            const newsId = listItem.getAttribute("newsId");
            showNewsDetail(newsId);
        });
    });

    // Register event to jump to details page
    const reservationDetails = document.querySelector(".reservation-details");
    reservationDetails.addEventListener("click", async (event) => {
        // Load dialog contents from separated HTML
        const response = await fetch("./details.html");
        if (!response.ok) {
            // Could not load the HTML, Rare case, log the error and stop
            console.log(
                `Failed to load edit reservation dialog contents. error status: ${response.status}`
            );
            return;
        }
        const html = await response.text();

        // Fade out and fade in
        const mainSection = document.querySelector("#main-section");
        mainSection.style.opacity = 0;
        setTimeout(async () => {
            mainSection.innerHTML = html;
            setTimeout(async () => {
                mainSection.style.opacity = 1;
                detailsVue = await MMR.initializeDetailPage();
            }, 300);
        }, 300);
    });

    // Show simple statistics
    const ctx = document.querySelector("#statistics-chart").getContext("2d");
    let chartConfig = {
        type: "line",

        data: {
            labels: [],
            datasets: [
                {
                    data: [],
                    borderColor: "#6B29F8",
                    borderWidth: 1,
                    pointRadius: 1,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltips: {
                mode: "point",
                intersect: false,
                yPadding: 6,
                xPadding: 12,
                caretSize: 6,
                backgroundColor: "#eeeeee",
                titleFontColor: "#444444",
                titleFontStyle: "normal",
                titleFontSize: 16,
                bodyFontColor: "#444444",
                borderColor: "#aaaaaa",
                bodyFontSize: 16,
                borderWidth: 1,
                displayColors: false,
                cornerRadius: 3,
            },
            hover: {
                mode: "point",
                intersect: true,
            },
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                },
            },
            scales: {
                scaleLabel: {
                    padding: 0,
                },
                xAxes: [
                    {
                        display: true,
                        ticks: {
                            display: false,
                            beginAtZero: true,
                        },
                        gridLines: {
                            drawBorder: true,
                            drawOnChartArea: true,
                            drawTicks: false,
                            zeroLineWidth: 0,
                            zeroLineColor: "#6B29F8",
                        },
                    },
                ],
                yAxes: [
                    {
                        display: true,
                        ticks: {
                            display: false,
                            beginAtZero: true,
                            steps: 10,
                            stepValue: 5,
                            max: 100,
                        },
                        gridLines: {
                            drawBorder: true,
                            drawOnChartArea: true,
                            drawTicks: false,
                            zeroLineWidth: 0,
                            zeroLineColor: "#6B29F8",
                        },
                    },
                ],
            },
        },
    };
    let chart = new Chart(ctx, chartConfig);

    // Start timer to randomly change footer illustration
    setInterval(() => {
        const illustration = document.querySelector("#footer-illustration");
        illustration.style.opacity = 0;
        setTimeout(() => {
            const randomId = Math.floor(Math.random() * 17) + 1;
            illustration.src = `./images/random${randomId}.svg`;
            illustration.style.opacity = 0.8;
        }, 2000);
    }, 8000);

    // Refresh statistics details and graph
    const refreshStatistics = async () => {
        const statisticsElement = document.querySelector(".statistics");
        if (!statisticsElement) {
            return;
        }
        const updateStatisticsDetail = (id, value) => {
            const element = document.querySelector(`#${id}`);
            if (value) {
                element.innerHTML = value;
            } else {
                element.innerHTML = MMR.currentLangResource.notEnoughData;
            }
        };
        const {
            mostPopular,
            mostCancelled,
            averageUsageRates,
        } = await GRAPHQL.getStatistics();
        updateStatisticsDetail("most-popular", mostPopular);
        updateStatisticsDetail("most-cancelled", mostCancelled);

        // Refresh usage graph
        if (averageUsageRates && averageUsageRates.length > 0) {
            chartConfig.data.labels = [];
            chartConfig.data.datasets[0].data = [];
            averageUsageRates.forEach(({ date, usage }) => {
                chartConfig.data.labels.push(
                    MMR.formatDateShort(new Date(date))
                );
                chartConfig.data.datasets[0].data.push(
                    Math.floor(usage * 10000) / 100
                );
            });
            chart.update();
        }
    };

    // Start timer to refresh statistics automatically
    setInterval(async () => {
        await refreshStatistics();
    }, 10000);
    await refreshStatistics();

    // Initialize Drift widget
    drift.config({
        locale: MMR.currentLangID,
        messages: {
            welcomeMessage: MMR.currentLangResource.driftWelcomeMessage,
            awayMessage: MMR.currentLangResource.driftAwayMessage,
        },
    });
    drift.load("dzh9fee8cnvv");
})();
