import db from "../config/db.ts";
import { log } from "../config/deps.ts";

const areas = db.collection("areas");

// Caching the areas collection contents
let cachedAreaData: any = {};

/**
 * Get all area data from DB and keep it in cache
 * Note: Require restart the server after changing the areas collection
 * @param lang User request language
 */
const getAreas = async (lang: string) => {
    log.debug("getAreas");

    if (!cachedAreaData[lang]) {
        log.debug("getAreas : loading from DB");
        log.debug({ lang });
        const areasCursor = areas.find();
        const areasFromDb = await areasCursor.toArray();
        const areasRemapped = areasFromDb.map((areaItem: any) => {
            const { areaName } = areaItem;
            areaItem.areaName = areaName[lang];
            return areaItem;
        });
        cachedAreaData[lang] = areasRemapped.sort((a: any, b: any) => {
            // Sort by areaName
            return a.areaName.localeCompare(b.areaName);
        });
    }
    return cachedAreaData[lang];
};

// GraphQL Definition
const area = {
    typeDef: `
        type Area {
            areaId: String!
            areaName: String!
            desc: String
        }
    `,
    inputDef: `
        input AreaInput {
            areaId: String!
            areaName: String!
            desc: String
        }
    `,
    queryDef: `
        getAreas: [Area!]!
        getOneArea(areaId: String!): Area
    `,
    mutationDef: `
        addArea(input: AreaInput!): Area
    `,
    resolversDef: {
        getAreas: async (_: any, __: any, context: any, info: any) => {
            const { lang } = context;
            return await getAreas(lang);
        },
        getOneArea: async (
            _: any,
            { areaId }: any,
            context: any,
            info: any
        ) => {
            return await areas.findOne({ areaId: areaId });
        },
        addArea: async (
            _: any,
            { input: input }: any,
            context: any,
            info: any
        ) => {
            const { areaId, areaName, desc } = input;

            // Check if an area with the same ID or Name exists
            const exists = await areas.findOne({
                $or: [{ areaId: areaId }, { areaName: areaName }],
            });

            // The insert function returns the areaId on success
            const insertResult = await areas.insertOne({
                areaId,
                areaName,
                desc,
            });
            if (!insertResult) {
                throw "DB error occurred.";
            }
            return { areaId: insertResult, areaName };
        },
    },
};

export { area as default, getAreas };
