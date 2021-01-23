import db from "../config/db.ts";
import { log } from "../config/deps.ts";

const rooms = db.collection("rooms");

// Caching the rooms collection contents
let cachedRoomData: any = {};

/**
 * Get all room data from DB and keep it in cache
 * Note: Require restart the server after changing the rooms collection
 * @param lang Request language
 * @param areaIds Filter by area if the areaIds is specified
 */
const getRooms = async (
    lang: string,
    areaIds: Array<string> | undefined | null
) => {
    log.debug("getRooms");
    log.debug({ areaIds });

    if (!cachedRoomData[lang]) {
        log.debug("getRooms : loading from DB");
        log.debug({ lang });

        const cursor = rooms.find();
        const roomsFromDb = await cursor.toArray();
        const roomsRemapped = roomsFromDb.map((roomItem: any) => {
            const { roomName } = roomItem;
            roomItem.roomName = roomName[lang];
            return roomItem;
        });
        cachedRoomData[lang] = roomsRemapped.sort((a: any, b: any) => {
            // Sort by roomName
            return a.roomName.localeCompare(b.roomName);
        });
    }

    if (areaIds && areaIds.length > 0) {
        return cachedRoomData[lang].filter(
            (room: any) => areaIds.indexOf(room.areaId) >= 0
        );
    } else {
        return cachedRoomData[lang];
    }
};

// GraphQL Definition
const room = {
    typeDef: `
        type Equipment {
            equipmentName: String!
            number: Int
        }
        type Room {
            roomId: String!
            roomName: String!
            areaId: String!
            location: String!
            capacity: Int!
            comment: String
            desc: String
            equipment: [Equipment]
        }
    `,
    inputDef: `
        input EquipmentInput {
            equipmentName: String!
            number: Int
        }
        input RoomInput {
            roomId: String!
            roomName: String!
            areaId: String!
            location: String!
            capacity: Int!
            comment: String
            desc: String
            equipment: [EquipmentInput]
        }
    `,
    queryDef: `
        getRooms(areaIds: [String]): [Room!]!
        getOneRoom(roomId: String!): Room
    `,
    mutationDef: `
        addRoom(input: RoomInput!): Room
    `,
    resolversDef: {
        getRooms: async (_: any, { areaIds }: any, context: any, info: any) => {
            const { lang } = context;
            return await getRooms(lang, areaIds);
        },
        getOneRoom: async (
            _: any,
            { roomId }: any,
            context: any,
            info: any
        ) => {
            return await rooms.findOne({ roomId: roomId });
        },
        addRoom: async (
            _: any,
            { input: input }: any,
            context: any,
            info: any
        ) => {
            const {
                roomId,
                roomName,
                areaId,
                location,
                capacity,
                comment,
                equipment,
            } = input;

            // Check if a room with the same ID or Name exists
            const exists = await rooms.findOne({
                $or: [{ roomId }, { roomName }],
            });
            if (exists) {
                throw "Duplicated data.";
            }

            // The insert function returns the roomId on success
            const insertResult = await rooms.insertOne({
                roomId,
                roomName,
                areaId,
                location,
                capacity,
                comment,
                equipment,
            });
            if (!insertResult) {
                throw "DB error occurred.";
            }
            return {
                roomId: insertResult,
                roomName,
                areaId,
                location,
                capacity,
            };
        },
    },
};

export { room as default, getRooms };
