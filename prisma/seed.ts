import { PrismaClient, Prisma } from '@prisma/client';
import * as cheerio from 'cheerio';

const axios = require('axios').default;

const url = 'http://en-to-pl.blogspot.com/';
const prisma = new PrismaClient();

async function main() {
  const fetchData = async (url: String) => {
    try {
      return await axios.get(url);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  const response = await fetchData(url);

  const $ = cheerio.load(response.data);

  type TWord = {
    en: String
    pl: String
    audio: String
  }

  let arr: Array<TWord> = [];

  for (let elm of $('#customers a')) {
    console.log("Fetching " + elm.attribs['href']);

    const response2 = await fetchData(elm.attribs['href']);

    const $$ = cheerio.load(response2.data);

    $$('tr').each((i, elm) => {
      if($$(elm).text().match('słuchać')) {
        const en = $$($$(elm).find('td')[0]).text();
        const pl = $$($$(elm).find('td')[1]).text();
        const audio = `https://konivjab.net/wp-content/uploads/2019/05/${en}.ogg`;

        arr.push({en: en, pl: pl, audio: audio});
      }
    });
  }

  try {
    await prisma.$transaction(async (prisma: any) => {
      for (let i of arr) {
        await prisma.word.create({data: i as Prisma.WordCreateInput})
      }
    }, {
      maxWait: 50000,
      timeout: 100000,
    })
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })
