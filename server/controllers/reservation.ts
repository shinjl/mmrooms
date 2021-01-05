import db from "../config/db.ts";
import { Bson } from "../config/deps.ts";
import { jwtVerify } from "../config/deps.ts";
import { getRooms } from "./room.ts";
import { log } from "../config/deps.ts";

const reservations = db.collection("reservations");
const users = db.collection("users");
const reservationHistory = db.collection("reservation_history");
const cancellationHistory = db.collection("cancellation_history");
const usageRate = db.collection("usage_rate");

// Save reservation return code to client
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
 * Authorization check
 * @param token The token from client
 */
const authorizationCheck = async (token: any) => {
    // Authorization check
    const secretKey =
        Deno.env.get("KEY") || "HuX6JpEXTrxZnRkaRevtqL9mDKVXkVxTTm9hvLN8m8fmXc";
    const utf8Encode = new TextEncoder();
    const jwt = new TextDecoder().decode(utf8Encode.encode(token));
    let payload = null;
    try {
        payload = await jwtVerify(jwt, secretKey, "HS512");
    } catch (error) {
        payload = null;
    }
    if (!payload) {
        log.error("Error: invalid token");
        return { authError: RETURN_CODE.INVALID_TOKEN };
    }
    const { sub, key } = payload;

    const loginUser: any = await users.findOne({ userId: sub });
    if (loginUser == null) {
        // User does not exist
        log.error(`Error: the user does not exists. User ID: ${sub}`);
        return { authError: RETURN_CODE.USER_NOT_FOUND };
    }

    if (loginUser.token !== key) {
        // User token does not match
        log.error(`Error: the user token does not match. Token: ${key}`);
        return { authError: RETURN_CODE.USER_TOKEN_MISMATCH };
    }

    return { authError: null, editUserId: loginUser.userId };
};

/**
 * Check if the user has the authorization to edit the record
 * @param editUserId Editing user ID
 * @param reservationId Reservation ID
 */
const ownerCheck = async (editUserId: any, reservationId: any) => {
    const existingReservation: any = await reservations.findOne({
        _id: { $eq: new Bson.ObjectId(reservationId) },
    });
    if (existingReservation == null) {
        // Record does not exist
        return { ownerError: RETURN_CODE.RESERVATION_NOT_FOUND };
    }

    let recordOwners = [existingReservation.user];
    if (
        existingReservation.mention != null &&
        existingReservation.mention.length > 0
    ) {
        existingReservation.mention.forEach((mentionedUser: any) => {
            recordOwners.push(mentionedUser);
        });
    }

    const foundOwner = recordOwners.find((owner) => owner === editUserId);
    if (!foundOwner) {
        // Only the creator or mentioned user can edit existing reservation
        return { ownerError: RETURN_CODE.NOT_AUTHORIZED };
    }

    return {
        ownerError: null,
        roomId: existingReservation.roomId,
        from: existingReservation.from,
    };
};

/**
 * Update reservation history
 * @param roomId ID of the reserved room
 */
const updateReservationHistory = async (roomId: string) => {
    const reservationHistoryData: any = await reservationHistory.findOne({
        roomId,
    });
    if (reservationHistoryData) {
        const { counter } = reservationHistoryData;
        await reservationHistory.updateOne(
            { _id: reservationHistoryData._id },
            {
                $set: {
                    counter: counter + 1,
                },
            }
        );
    } else {
        await reservationHistory.insertOne({
            roomId,
            counter: 1,
        });
    }
};

/**
 * Update cancellation history
 * @param roomId ID of the cancelled room
 */
const updateCancellationHistory = async (roomId: string) => {
    const cancellationHistoryData: any = await cancellationHistory.findOne({
        roomId,
    });
    if (cancellationHistoryData) {
        const { counter } = cancellationHistoryData;
        await cancellationHistory.updateOne(
            { _id: cancellationHistoryData._id },
            {
                $set: {
                    counter: counter + 1,
                },
            }
        );
    } else {
        await cancellationHistory.insertOne({
            roomId,
            counter: 1,
        });
    }
};

/**
 * Update usage rate. Since the minimum unit is day, so only use the From
 * @param roomId Target room ID
 * @param from Beginning of the reservation time
 * @param updateFlag 1: New/edit reservation, 0: Delete reservation
 */
const updateUsageRate = async (
    roomId: string,
    from: string,
    updateFlag: number
) => {
    const counterPlus = updateFlag ? 1 : -1;
    const targetDate = from.substring(0, 10);
    const usageRateData: any = await usageRate.findOne({ date: targetDate });
    if (usageRateData) {
        let { rooms } = usageRateData;
        if (!rooms) {
            rooms = [];
        }
        let oneRoom = rooms.find((room: any) => room.roomId === roomId);
        if (oneRoom) {
            oneRoom.counter += counterPlus;
            if (oneRoom.counter < 0) {
                oneRoom.counter = 0;
            }
        } else {
            const counter = counterPlus > 0 ? counterPlus : 0;
            rooms.push({ roomId, counter });
        }
        log.debug({ usageRateData });
        await usageRate.updateOne(
            { _id: usageRateData._id },
            {
                $set: {
                    rooms,
                },
            }
        );
    } else {
        const counter = counterPlus > 0 ? counterPlus : 0;
        await usageRate.insertOne({
            date: targetDate,
            rooms: [
                {
                    roomId,
                    counter,
                },
            ],
        });
    }
};

// GraphQL Definition
const reservation = {
    typeDef: `
        type Reservation {
            reservationId: ID!
            user: String!
            from: String!
            to: String!
            roomId: String!
            roomName: String
            purpose: String
            comment: String
            mention: [String!]
        }
        type UsageRate {
            date: Float
            usage: Float
        }
        type Statistics {
            mostPopular: String
            mostCancelled: String
            averageUsageRates: [UsageRate!]
        }
    `,
    inputDef: `
        input ReservationInput {
            reservationId: ID
            user: String!
            from: String!
            to: String!
            roomId: String!
            purpose: String
            comment: String
            mention: [String!]
        }
    `,
    queryDef: `
        getOneReservation(reservationId: String!): Reservation!
        getReservations(user: String, from: String, to: String, roomId: String, areaId: String): [Reservation!]!
        getRoomReservations(from: String!, to: String!, roomIds: [String]!): [Reservation!]!
        checkReservation(reservationId: String!, from: String!, to: String!, roomId: String!): Boolean!
        getStatistics: Statistics!
    `,
    mutationDef: `
        saveReservation(input: ReservationInput!): Int!
        deleteReservation(reservationId: String!): Int!
    `,
    resolversDef: {
        /**
         * Get reservation data by unique ID
         */
        getOneReservation: async (
            _: any,
            { reservationId }: any,
            context: any,
            info: any
        ) => {
            log.debug("getOneReservation");
            log.debug({ context });
            log.debug({ reservationId });

            const { lang } = context;
            let roomName = "";
            const reservationFromDb: any = await reservations.findOne({
                _id: new Bson.ObjectId(reservationId),
            });
            if (reservationFromDb) {
                const rooms = await getRooms(lang, null);
                const oneRoom = rooms.find(
                    (room: any) => room.roomId === reservationFromDb.roomId
                );
                if (oneRoom) {
                    roomName = oneRoom.roomName;
                }
            }
            return { ...reservationFromDb, reservationId, roomName };
        },
        /**
         * Get user reservations for given term
         */
        getReservations: async (
            _: any,
            { user, from, to, roomId, areaId }: any,
            context: any,
            info: any
        ) => {
            log.debug("getReservations");
            log.debug({ context });
            log.debug({ user, from, to, roomId, areaId });

            const { lang } = context;
            const rooms = await getRooms(lang, null);

            let parameter: { [key: string]: any } = {};
            if (user) parameter["user"] = user;
            if (from) parameter["to"] = { $gt: from };
            if (to) parameter["from"] = { $lt: to };
            if (roomId) parameter["roomId"] = roomId;
            if (areaId) parameter["areaId"] = areaId;
            const cursor = reservations.find(parameter);
            const reservationsFromDb = await cursor.toArray();
            const reservationsRemapped = reservationsFromDb.map(
                (reservation: any) => {
                    const { _id: reservationId } = reservation;
                    reservation.reservationId = reservationId.toString();
                    reservation.roomName = "";
                    const oneRoom = rooms.find(
                        (room: any) => room.roomId === reservation.roomId
                    );
                    if (oneRoom) {
                        reservation.roomName = oneRoom.roomName;
                    }
                    return reservation;
                }
            );
            return reservationsRemapped.sort((a: any, b: any) => {
                // Sort by from datetime
                return a.from.localeCompare(b.from);
            });
        },
        /**
         * Get reservations of given rooms for given term
         */
        getRoomReservations: async (
            _: any,
            { from, to, roomIds }: any,
            context: any,
            info: any
        ) => {
            log.debug("getRoomReservations");
            log.debug({ context });
            log.debug({ from, to, roomIds });

            let parameter: { [key: string]: any } = {
                roomId: { $in: roomIds },
                from: { $lt: to },
                to: { $gt: from },
            };
            const cursor = reservations.find(parameter);
            const reservationsFromDb = await cursor.toArray();
            return reservationsFromDb.map((reservation: any) => {
                const { _id: reservationId } = reservation;
                reservation.reservationId = reservationId.toString();
                return reservation;
            });
        },

        /**
         * Check if a room is available for reservation
         */
        checkReservation: async (
            _: any,
            { reservationId, from, to, roomId }: any,
            context: any,
            info: any
        ) => {
            const parameter: { [key: string]: any } = {
                roomId: roomId,
                from: { $lt: to },
                to: { $gt: from },
            };
            const cursor = reservations.find(parameter);
            const reservationsFromDb = await cursor.toArray();
            if (reservationsFromDb.length > 1) {
                // Not available
                return false;
            } else if (reservationsFromDb.length === 1) {
                // Check if the reservation is the current one
                const one: any = reservationsFromDb[0];
                const { _id: reservationIdFromDb } = one;
                // Not available if the reservationId is different
                return reservationIdFromDb.toString() === reservationId;
            } else {
                // Otherwise available
                return true;
            }
        },
        /**
         * Save reservation data (new or update)
         */
        saveReservation: async (
            _: any,
            { input: input }: any,
            context: any,
            info: any
        ) => {
            log.debug("saveReservation");
            log.debug({ context });
            log.debug({ input });
            const {
                reservationId,
                user,
                from,
                to,
                roomId,
                purpose,
                comment,
                mention,
            } = input;

            // Check if the room is available
            const available = await reservation.resolversDef.checkReservation(
                _,
                input,
                context,
                info
            );
            if (!available) {
                // room not available
                return RETURN_CODE.ROOM_NOT_AVAILABLE;
            }

            // Term check
            const fromDatetime = new Date(from);
            const toDatetime = new Date(to);
            const term = toDatetime.getTime() - fromDatetime.getTime();
            if (term <= 0) {
                // invalid period
                return RETURN_CODE.INVALID_PERIOD;
            }
            if (term > 24 * 60 * 60 * 1000) {
                // The period is larger than 24 hours
                log.debug(`The period is larger than 24 hours: ${term}`);
                return RETURN_CODE.PERIOD_LARGER_THAN_24_HOURS;
            }

            // Authorization check
            const { authError, editUserId } = await authorizationCheck(
                context.token
            );
            if (authError) {
                return authError;
            }

            if (reservationId) {
                // Check if the user has the authorization to edit the record
                const { ownerError } = await ownerCheck(
                    editUserId,
                    reservationId
                );
                if (ownerError) {
                    return ownerError;
                }

                // Existing data, update
                const {
                    matchedCount,
                    modifiedCount,
                } = await reservations.updateOne(
                    { _id: { $eq: new Bson.ObjectId(reservationId) } },
                    {
                        $set: {
                            user: editUserId,
                            from,
                            to,
                            roomId,
                            purpose,
                            comment,
                            mention,
                        },
                    }
                );

                log.debug({ matchedCount, modifiedCount });
                if (matchedCount !== 1) {
                    // DB error
                    return RETURN_CODE.DB_ERROR;
                }
            } else {
                // New one, insert
                const insertResult = await reservations.insertOne({
                    user: editUserId,
                    from,
                    to,
                    roomId,
                    purpose,
                    comment,
                    mention,
                });

                log.debug({ insertResult });
                // The insert function returns the _id on success
                if (!insertResult) {
                    // DB error
                    return RETURN_CODE.DB_ERROR;
                }

                // Update reservation history
                await updateReservationHistory(roomId);
            }

            // Update usage rate
            await updateUsageRate(roomId, from, 1);

            return RETURN_CODE.SUCCESS;
        },
        /**
         * Save reservation data (new or update)
         */
        deleteReservation: async (
            _: any,
            { reservationId }: any,
            context: any,
            info: any
        ) => {
            log.debug("deleteReservation");
            log.debug({ reservationId });
            log.debug({ context });

            // Authorization check
            const { authError, editUserId } = await authorizationCheck(
                context.token
            );
            if (authError) {
                return authError;
            }

            // Check if the user has the authorization to edit the record
            const { ownerError, roomId, from } = await ownerCheck(
                editUserId,
                reservationId
            );
            if (ownerError) {
                return ownerError;
            }

            const deleteCount = await reservations.deleteOne({
                _id: new Bson.ObjectId(reservationId),
            });
            if (deleteCount === 1) {
                // Update cancellation history
                await updateCancellationHistory(roomId);

                // Update usage rate
                await updateUsageRate(roomId, from, 0);

                return RETURN_CODE.SUCCESS;
            } else {
                return RETURN_CODE.DB_ERROR;
            }
        },
        /**
         * Get statistics data
         */
        getStatistics: async (_: any, __: any, context: any, info: any) => {
            const { lang } = context;
            const rooms = await getRooms(lang, null);
            const findMaxCounter = (data: any): string => {
                if (data.length > 0) {
                    const maxCounterData = data.reduce(
                        (accumulator: any, current: any) => {
                            return accumulator.counter > current.counter
                                ? accumulator
                                : current;
                        },
                        []
                    );
                    if (maxCounterData) {
                        const foundRoom = rooms.find(
                            (room: any) => room.roomId === maxCounterData.roomId
                        );
                        if (foundRoom) {
                            return foundRoom.roomName;
                        }
                    }
                }
                return "";
            };

            // Usage rate calculation period: past 30 days
            const padToTwo = (number: number) =>
                number <= 99 ? `0${number}`.slice(-2) : number;
            const formatDate = (date: Date) => {
                return `${date.getFullYear()}/${padToTwo(
                    date.getMonth() + 1
                )}/${padToTwo(date.getDate())}`;
            };
            const calcTo = new Date();
            calcTo.setHours(0, 0, 0, 0);
            const calcFrom = new Date(
                calcTo.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            calcFrom.setHours(0, 0, 0, 0);

            const reservationHistoryCursor = reservationHistory.find();
            const reservationHistoryData = await reservationHistoryCursor.toArray();

            const cancellationHistoryCursor = cancellationHistory.find();
            const cancellationHistoryData = await cancellationHistoryCursor.toArray();

            const usageRateCursor = usageRate.find({
                $and: [
                    { date: { $gte: `${formatDate(calcFrom)}` } },
                    { date: { $lte: `${formatDate(calcTo)}` } },
                ],
            });
            const usageRateData = await usageRateCursor.toArray();

            // Calculate average use rates
            let usageRateDataMapping: any = {};
            if (usageRateData && usageRateData.length > 0) {
                usageRateData.forEach((data: any) => {
                    usageRateDataMapping[data.date] = data.rooms.length;
                });
            }
            const totalRoom = rooms.length;
            let averageUsageRates: Array<any> = [];
            for (
                let t = calcFrom.getTime();
                t <= calcTo.getTime();
                t += 24 * 60 * 60 * 1000
            ) {
                let usage = 0;
                const existingUsageData =
                    usageRateDataMapping[formatDate(new Date(t))];
                if (existingUsageData) {
                    usage = existingUsageData / totalRoom;
                }
                averageUsageRates.push({
                    date: t,
                    usage,
                });
            }

            const mostPopular = findMaxCounter(reservationHistoryData);
            const mostCancelled = findMaxCounter(cancellationHistoryData);

            return { mostPopular, mostCancelled, averageUsageRates };
        },
    },
};

export default reservation;
