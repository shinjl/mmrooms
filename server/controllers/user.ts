import db from "../config/db.ts";
import { jwtCreate } from "../config/deps.ts";
import { log } from "../config/deps.ts";

const users = db.collection("users");
const userHistory = db.collection("user_history");

/**
 * Get all user data from DB and select the user name by requested language
 * @param lang Request language
 */
const getUsers: any = async (lang: string) => {
    const cursor = users.find();
    const usersFromDb = await cursor.toArray();
    const userRemapped = usersFromDb.map((userItem: any) => {
        const { userName } = userItem;
        userItem.userName = userName[lang];
        return userItem;
    });
    return userRemapped.sort((a: any, b: any) => {
        // Sort by userId
        return a.userId.localeCompare(b.userId);
    });
};

// GraphQL Definition
const user = {
    typeDef: `
        type User {
            userId: String!
            userName: String!
            desc: String
        }
        type LoginInfo {
            userId: String!
            token: String!
        }
    `,
    queryDef: `
        getUsers: [User!]!
        getLoginUser: LoginInfo!
    `,
    resolversDef: {
        getUsers: async (_: any, __: any, context: any, info: any) => {
            log.debug("getUsers");
            const { lang } = context;
            log.debug("getUsers 2");

            return await getUsers(lang);
        },
        getLoginUser: async (_: any, __: any, context: any, info: any) => {
            log.debug("getLoginUser");
            const { lang } = context;

            // Get al user info from user collection
            const usersFromDb = await getUsers(lang);

            // Find a random user ID that is not used so far
            let foundUserId = "";
            let foundToken = "";
            let found = false;
            let counter = 0;
            while (true) {
                const randomIndex = Math.floor(Math.random() * 1000);
                const { userId, token }: any = usersFromDb[randomIndex];

                const cursor = userHistory.find({ userId });
                const historyData = await cursor.toArray();
                if (historyData.length === 0) {
                    foundUserId = userId;
                    foundToken = token;
                    found = true;
                    break;
                }
                if (counter > 100000) {
                    // Tried too many times, give up for searching new ID
                    log.error("Could not find any available user ID");
                    break;
                }
            }

            // Found one, insert it to user history collection
            if (found) {
                const issued = new Date();
                const insertResult = await userHistory.insertOne({
                    userId: foundUserId,
                    issued,
                });
                log.debug("Insert user_history");
                log.debug({ insertResult });

                // Create JWT object
                const secretKey =
                    Deno.env.get("KEY") ||
                    "HuX6JpEXTrxZnRkaRevtqL9mDKVXkVxTTm9hvLN8m8fmXc";
                const payload = {
                    sub: foundUserId,
                    key: foundToken,
                    iat: new Date().getTime(),
                };
                const jwt = await jwtCreate(
                    { alg: "HS512", typ: "JWT" },
                    payload,
                    secretKey
                );

                return { userId: foundUserId, token: jwt };
            }

            return { error: "Failed to get user information." };
        },
    },
};

export default user;
