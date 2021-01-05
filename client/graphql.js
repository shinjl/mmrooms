/**
 * GraphQL functions
 */
const GRAPHQL = (() => {
    /**
     * Fetch data via GraphQL
     * @param {*} query GraphQL query
     * @param {*} variables Query variables
     * @param {*} key The query invoker name
     */
    const graphqlQuery = async (query, variables, key) => {
        const response = await fetch("/graphql/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                token: MMR.token,
                lang: MMR.currentLangID,
            },
            body: JSON.stringify({
                query: query,
                variables: variables,
            }),
        });
        const data = await response.json();
        if (data) {
            if (data["error"]) {
                console.log(data["error"]);
                return null;
            } else {
                return data["data"][key];
            }
        } else {
            return null;
        }
    };

    /**
     * Get reservation data by reservation ID
     * @param {*} reservationId Reservation ID
     */
    const getOneReservation = async (reservationId) => {
        const variables = { reservationId };
        return await graphqlQuery(
            `
            query getOneReservation($reservationId: String!) {
                getOneReservation(reservationId: $reservationId) {
                    reservationId
                    user
                    from
                    to
                    roomId
                    roomName
                    purpose
                    comment
                    mention
                }
            }`,
            variables,
            "getOneReservation"
        );
    };

    /**
     * Get the given user's reservations
     * @param {*} user User ID
     * @param {*} from From
     * @param {*} to To
     * @param {*} roomId Room ID
     */
    const getReservations = async (user, from, to, roomId) => {
        const variables = { user, from, to, roomId };
        let reservations = await graphqlQuery(
            `
            query getReservations($user: String, $from: String, $to: String, $roomId: String) {
                getReservations(user: $user, from: $from, to: $to, roomId: $roomId) {
                    reservationId
                    user
                    from
                    to
                    roomId
                    roomName
                }
            }`,
            variables,
            "getReservations"
        );

        if (reservations) {
            reservations = reservations.map((reservation) => {
                // Map the from/to to a single string for display
                reservation.time = `${reservation.from.substring(
                    5
                )} - ${reservation.to.substring(11)}`;
                return reservation;
            });
        }
        return reservations;
    };

    /**
     * Get reservations for given term
     * @param {*} from From
     * @param {*} to To
     * @param {*} areaId Area ID
     * @param {*} roomId Room ID
     */
    const getReservationsStatus = async (from, to, areaId, roomId) => {
        const variables = { user: undefined, from, to, areaId, roomId };
        return await graphqlQuery(
            `
            query getReservations($from: String, $to: String, $roomId: String, $areaId: String) {
                getReservations(from: $from, to: $to, roomId: $roomId, areaId: $areaId) {
                    from
                    to
                    roomId
                    reservationId
                }
            }`,
            variables,
            "getReservations"
        );
    };

    /**
     * Get reservations of given rooms for given term
     * @param {*} from From
     * @param {*} to To
     * @param {*} roomIds Room IDs
     */
    const getRoomReservations = async (from, to, roomIds) => {
        const variables = { from, to, roomIds };
        return await graphqlQuery(
            `
            query getRoomReservations($from: String!, $to: String!, $roomIds: [String]!) {
                getRoomReservations(from: $from, to: $to, roomIds: $roomIds) {
                    from
                    to
                    roomId
                    reservationId
                    user
                }
            }`,
            variables,
            "getRoomReservations"
        );
    };

    /**
     * Check if a room is available for reservation
     * @param {*} reservationId Reservation ID
     * @param {*} from From
     * @param {*} to To
     * @param {*} roomId Room ID
     */
    const checkReservation = async (reservationId, from, to, roomId) => {
        const variables = { reservationId, from, to, roomId };
        return await graphqlQuery(
            `
            query checkReservation($reservationId: String!, $from: String!, $to: String!, $roomId: String!) {
                checkReservation(reservationId: $reservationId, from: $from, to: $to, roomId: $roomId) 
            }`,
            variables,
            "checkReservation"
        );
    };

    /**
     * Save reservation data
     * @param {*} input Reservation data
     */
    const saveReservation = async (input) => {
        const variables = {
            input: {
                ...input,
            },
        };
        return await graphqlQuery(
            `
            mutation saveReservation($input: ReservationInput!) {
                saveReservation(input: $input)
            }`,
            variables,
            "saveReservation"
        );
    };

    /**
     * Delete a reservation data
     * @param {*} reservationId Reservation ID
     */
    const deleteReservation = async (reservationId) => {
        const variables = { reservationId };
        return await graphqlQuery(
            `
            mutation deleteReservation($reservationId: String!) {
                deleteReservation(reservationId: $reservationId)
            }`,
            variables,
            "deleteReservation"
        );
    };

    /**
     * Get all room data, filter by area if the areaId is specified
     * @param {*} areaIds Area ID [array]
     */
    const getRooms = async (areaIds) => {
        let variables = {};
        if (areaIds) {
            variables["areaIds"] = areaIds;
        }
        return await graphqlQuery(
            `
            query getRooms($areaIds: [String]) {
                getRooms(areaIds: $areaIds) {
                    roomId
                    roomName
                    areaId
                }
            }`,
            variables,
            "getRooms"
        );
    };

    /**
     * Get room data by Room ID
     * @param {*} roomId
     */
    const getOneRoom = async (roomId) => {
        const variables = { roomId };
        return await graphqlQuery(
            `
            query getOneRoom($roomId: String!) {
                getOneRoom(roomId: $roomId) {
                    roomId
                    roomName
                    area
                    location
                    capacity
                    comment
                    desc
                    equipment {
                        equipmentName
                        number
                    }
                }
            }`,
            variables,
            "getOneRoom"
        );
    };

    /**
     * Add room to database
     * @param {*} roomInfo Room data
     */
    const addRoom = async (roomInfo) => {
        const variables = {
            input: {
                ...roomInfo,
            },
        };
        return await graphqlQuery(
            `
            mutation addRoom($input: RoomInput!) {
                addRoom(input: $input) {
                    roomId
                }
            }`,
            variables,
            "addRoom"
        );
    };

    /**
     * Get all area data
     */
    const getAreas = async () => {
        return await graphqlQuery(
            `
            query {
                getAreas {
                    areaId
                    areaName
                }
            }`,
            {},
            "getAreas"
        );
    };

    /**
     * Get all user data
     */
    const getUsers = async () => {
        let users = await graphqlQuery(
            `
            query {
                getUsers {
                    userId
                    userName
                }
            }`,
            {},
            "getUsers"
        );

        if (users) {
            users = users.map((user) => {
                // Add key/value pair for Tribute (implements)
                user.key = user.userId;
                user.value = `${user.userId}:${user.userName}`;
                return user;
            });
        }
        return users;
    };

    /**
     * Get login user info for first time user
     */
    const getLoginUser = async () => {
        return await graphqlQuery(
            `
            query {
                getLoginUser {
                    userId
                    token
                }
            }`,
            {},
            "getLoginUser"
        );
    };

    /**
     * Get all news
     */
    const getNews = async () => {
        let news = await graphqlQuery(
            `
            query {
                getNews {
                    newsId
                    issued
                    title
                }
            }`,
            {},
            "getNews"
        );

        if (news) {
            news = news.map((newItem) => {
                newItem.time = `${newItem.issued.substring(5)}`;
                return newItem;
            });
        }
        return news;
    };

    /**
     * Get news content
     */
    const getNewsContent = async (newsId) => {
        const variables = { newsId };
        return await graphqlQuery(
            `
            query getNewsContent($newsId: String!) {
                getNewsContent(newsId: $newsId) {
                    issued
                    title
                    content
                    width
                    showLoading
                    credit
                }
            }`,
            variables,
            "getNewsContent"
        );
    };

    /**
     * Get statistics data from server
     */
    const getStatistics = async () => {
        return await graphqlQuery(
            `
            query getStatistics {
                getStatistics {
                    mostPopular
                    mostCancelled
                    averageUsageRates {
                        date
                        usage
                    }
                }
            }`,
            {},
            "getStatistics"
        );
    };

    // Expose basic functions to the outside world
    return {
        getOneReservation,
        getReservations,
        getReservationsStatus,
        getRoomReservations,
        checkReservation,
        saveReservation,
        deleteReservation,
        getRooms,
        getOneRoom,
        addRoom,
        getAreas,
        getUsers,
        getLoginUser,
        getNews,
        getNewsContent,
        getStatistics,
    };
})();
