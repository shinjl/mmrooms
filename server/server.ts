import { Application, Router, send } from "./config/deps.ts";
import { applyGraphQL } from "./config/deps.ts";
import { log } from "./config/deps.ts";
import { resolvers, typeDefs } from "./controllers/graphql.ts";

const app = new Application();

// Logger setup
await log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler("DEBUG", {
            formatter: "{datetime} - {levelName} {msg}",
        }),
    },

    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console"],
        },
    },
});

// Get token from request header and pass it to GraphQL
let requestToken = "";
const getToken = () => {
    return requestToken;
};

// Get user language from request header and pass it to GraphQL
let requestLang = "";
const getLang = () => {
    return requestLang;
};

// Initialize GraphQL
const useGraphqlPlayground = "true" === Deno.env.get("GRAPHQL_PLAYGROUND");
const GraphQLService = await applyGraphQL<Router>({
    Router,
    typeDefs,
    resolvers,
    usePlayground: useGraphqlPlayground,
    context: (ctx) => {
        return { token: getToken(), lang: getLang() };
    },
});

// Get token from header
app.use(async (ctx, next) => {
    requestToken = ctx.request.headers.get("token") || "";
    requestLang = ctx.request.headers.get("lang") || "en";
    await next();
});

// Logger
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    log.info(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Logger
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// Apply GraphQL router
app.use(GraphQLService.routes(), GraphQLService.allowedMethods());

// Serve static pages
app.use(async (context) => {
    await send(context, context.request.url.pathname, {
        root: `${Deno.cwd()}/client`,
        index: "main.html",
    });
});

const port = 8899;
log.info(`Server started on http://localhost:${port}`);
await app.listen({ port });
