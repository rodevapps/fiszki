const cors = require('cors');
const express = require('express');
import { PrismaClient } from '@prisma/client';
import { graphqlHTTP } from 'express-graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

const prisma = new PrismaClient();

const typeDefs = `
  type Word {
    en: String!
    pl: String!
    audio: String!
  }

  type Query {
    getWord: Word!
  }

  type Mutation {
    badAnswer(en: String!): String!
    goodAnswer(en: String!): String!
  }
`;

type Params = {
  en: string
}

const resolvers = {
  Query: {
    getWord: async () => {
      const mscore = await prisma.word.aggregate({
        _min: {
          score: true,
        },
      });

      console.log(mscore);

      const words = await prisma.word.findMany({
        where: {
          score: mscore._min.score as number,
        }
      });

      console.log(words);

      const n = words.length;

      if (n) {
        const nn = Math.floor(Math.random() * n);

        return words[nn];
      } else {
        return words[0];
      }
    }
  },
  Mutation: {
    badAnswer: async (_: any, args: Params) => {
      return await cscore(args.en, -10);
    },
    goodAnswer: async (_: any, args: Params) => {
      return await cscore(args.en, 5);
    }
  }
};

const cscore = async (sen: string, n: number): Promise<string> => {
  const word = await prisma.word.findUnique({
    where: {
      en: sen,
    },
  });

  if (word !== null) {
    const score = word.score + n;

    await prisma.word.update({
      where: {
        en: sen,
      },
      data: {
        score: score,
      },
    });

    return 'ok!';
  } else {
    return 'not found!';
  }
}

export const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

const app = express();
app.use(cors());
app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));
app.listen(4000);

console.log('Running a GraphQL API server at http://localhost:4000/graphql');
