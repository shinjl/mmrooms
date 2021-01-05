import db from "../config/db.ts";
import { Bson } from "../config/deps.ts";
import { log } from "../config/deps.ts";

const newsCollections = db.collection("news");

// GraphQL Definition
const news = {
    typeDef: `
        type News {
            newsId: ID!
            issued: String!
            title: String!
            content: String!
            width: Int!
            showLoading: Boolean
            credit: String
        }
    `,
    queryDef: `
        getNews: [News]
        getNewsContent(newsId: String!): News
    `,
    resolversDef: {
        getNews: async (_: any, __: any, context: any, info: any) => {
            log.debug("getNews");
            log.debug({ context });

            const { lang } = context;
            const cursor = newsCollections.find();
            const newsFromDb = await cursor.toArray();
            const newsRemapped = newsFromDb.map((newsItem: any) => {
                const { _id: newsId, title } = newsItem;
                newsItem.newsId = newsId.toString();
                newsItem.title = title[lang];
                return newsItem;
            });
            return newsRemapped.sort((a: any, b: any) => {
                // Sort by issued date reverse order
                return b.issued.localeCompare(a.issued);
            });
        },
        getNewsContent: async (
            _: any,
            { newsId }: any,
            context: any,
            info: any
        ) => {
            log.debug("getNewsContent");
            log.debug({ newsId });
            log.debug({ context });

            const { lang } = context;
            let newsFromDb: any = await newsCollections.findOne({
                _id: new Bson.ObjectId(newsId),
            });
            const { title, content } = newsFromDb;
            newsFromDb.newsId = newsId;
            newsFromDb.title = title[lang];
            newsFromDb.content = content[lang] ? content[lang] : content["en"];
            return newsFromDb;
        },
    },
};

export default news;
