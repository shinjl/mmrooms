import { gql } from '../config/deps.ts';
import news from './news.ts';
import user from './user.ts';
import room from './room.ts';
import area from './area.ts';
import reservation from './reservation.ts';

// @ts-ignore
const typeDefs = gql`
    ${news.typeDef}
    ${user.typeDef}
    ${room.typeDef}
    ${area.typeDef}
    ${reservation.typeDef}

    ${room.inputDef}
    ${area.inputDef}
    ${reservation.inputDef}

    type Query {
        ${news.queryDef}
        ${user.queryDef}
        ${room.queryDef}
        ${area.queryDef}
        ${reservation.queryDef}
    }

    type Mutation {
        ${room.mutationDef}
        ${area.mutationDef}
        ${reservation.mutationDef}
    }
`;

const resolvers = {
    Query: {
        getNews: news.resolversDef.getNews,
        getNewsContent: news.resolversDef.getNewsContent,
        getUsers: user.resolversDef.getUsers,
        getLoginUser: user.resolversDef.getLoginUser,
        getRooms: room.resolversDef.getRooms,
        getOneRoom: room.resolversDef.getOneRoom,
        getAreas: area.resolversDef.getAreas,
        getOneArea: area.resolversDef.getOneArea,
        getOneReservation: reservation.resolversDef.getOneReservation,
        getReservations: reservation.resolversDef.getReservations,
        getRoomReservations: reservation.resolversDef.getRoomReservations,
        checkReservation: reservation.resolversDef.checkReservation,
        getStatistics: reservation.resolversDef.getStatistics,
    },
    Mutation: {
        saveReservation: reservation.resolversDef.saveReservation,
        deleteReservation: reservation.resolversDef.deleteReservation,
    },
};

export { typeDefs, resolvers };
