const puppeteer = require("puppeteer");
const firebase = require("firebase");
const { SentimentAnalyzer } = require('node-nlp');
const translate = require('@vitalets/google-translate-api')
const sentiment = new SentimentAnalyzer({ language: 'en' });
const firebaseConfig = {
  apiKey: "AIzaSyDgL_6B5_EVkeJljC8qC05anG55rb9b27U",
  authDomain: "scrapervesti.firebaseapp.com",
  databaseURL: "https://scrapervesti.firebaseio.com",
  projectId: "scrapervesti",
  storageBucket: "scrapervesti.appspot.com",
  messagingSenderId: "1083280998081",
  appId: "1:1083280998081:web:dccb90bd6d9720d311de40",
  measurementId: "G-HHFQ8BRRPN",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
let articlesDB = [];
let tagsDB = [];

let tagsTotal = new Map();

let articlesDocRef = firebase.firestore().collection("arts");

let tagsDocRef = firebase.firestore().collection('tags');

const getArticles = (list) =>
  articlesDocRef
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data(),
        });
        // console.log(doc.id, " => ", doc.data());
      });
      return list;
    })
    .catch((error) => {
      console.log("Error getting documents: ", error);
    });

const getTags = (list) =>
    tagsDocRef
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data(),
          });
          // console.log(doc.id, " => ", doc.data());
        });
        return list;
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
      });


const danas = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let articles = [];

  await page.goto("https://www.danas.rs/novo/");

  await page.waitForSelector("article");

  const data = await page.$$("article");

  let oldNews = 0;

  for (let i = 0; i < data.length; i++) {
    // if(oldNews>3) break;

    await page.goto("https://www.danas.rs/novo/");
    const data = await page.$$("article");

    const title = await data[i].$("h2.article-post-title");

    const a = await title.$("a");

    const titleText = await page.evaluate((title) => title.innerText, title);

    const link = await page.evaluate((a) => a.getAttribute("href"), a);

    await page.goto(link);

    await page.waitForSelector("article");

    const contentWrapper = await page.$("article");

    const contentRef = await page.$("div.post-content.content");

    const contents = await contentRef.$$("p");

    var text = "";

    for (const c of contents) {
      const res = await page.evaluate((c) => c.innerText, c);
      text += res;
    }

    const contentMeta = await contentWrapper.$("div.post-meta-bottom");

    var tagsSpan = null;
    var tags = [];

    var tagsReal = [];

    try {
      tagsSpan = await contentMeta.$("span.post-meta-bottom-tags");
      tags = await tagsSpan.$$("a");

      for (const tag of tags) {
        const res = await page.evaluate((tag) => tag.innerText, tag);
        tagsReal.push(res.toLowerCase());
        tagsTotal.has(res.toLowerCase())
          ? tagsTotal.set(res.toLowerCase(), tagsTotal.get(res) + 1)
          : tagsTotal.set(res.toLowerCase(), 1);
      }
    } catch (error) {
      //   console.log(error);
    }

    const newArt = new Article(titleText, text, tagsReal, "Danas", "", "");

    if (
      articlesDB.filter(
        (element) => element.title === titleText
      ).length === 0
    ) {
      let tt = await translate(titleText, {to: 'en'});
      console.log(tt);

      let sent = await sentiment.getSentiment(tt.text);
      console.log(sent)

      articlesDocRef
        .add({
          title: titleText,
          content: text,
          tags: tagsReal,
          source: "Danas",
          url: link,
          sentiment: sent.score,
        })
        .then((ref) => console.log("Added Document with ID: ", ref.id));
    } else {
      // let tt = await translate(titleText, {to: 'en'});

      // let sent = await sentiment.getSentiment(tt.text);

      // console.log(sent);

      console.log('Already in DB!!!');
      oldNews += 1;
    }

    articles.push(newArt);
  }

  await browser.close();

  console.log("Danas finished loading " + data.length + " articles, " + data.length-oldNews + " of which are new");

  return articles;
};

const informer = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://informer.rs/najnovije-vesti");

  await page.waitForSelector("div.container");

  const dataRef = await page.$(
    "main > div.container > div.content > div.row > div.col-md-8 > section.category-wrapper.category-news.pt-2 > ul.list-unstyled.category-news-list.mb-4"
  );

  const lis = await dataRef.$$("li");

  for (let i = 0; i < lis.length; i++) {
    await page.goto("https://informer.rs/najnovije-vesti");

    const dataRef = await page.$(
      "main > div.container > div.content > div.row > div.col-md-8 > section.category-wrapper.category-news.pt-2 > ul.list-unstyled.category-news-list.mb-4"
    );

    const lis = await dataRef.$$("li");

    try {
      const res = await lis[i].$("div.col-6.col-xm-5.col-xl-4 > a.img-holder");

      const title = await page.evaluate((a) => a.getAttribute("title"), res);
      const url =
        "https://informer.rs" +
        (await page.evaluate((a) => a.getAttribute("href"), res));

      await page.goto(url);

      const contentRef = await page.$(
        "main > div.container > div.content > div.row > div.col-md-8 > article.single-news > div.single-news-content"
      );

      var tagsRef = null;
      var tags = [];
      var tagsReal = [];

      try {
        tagsRef = await page.$(
          "main > div.container > div.content > div.row > div.col-md-8 > article.single-news > div.single-news-footer.d-flex.flex-wrap.justify-content-between.align-items-center >" +
            " div.news-tags.d-xl-flex.align-items-center.my-2.pl-0.col-xl-12 > div"
        );

        tags = await tagsRef.$$("a.news-tag");

        for (const tag of tags) {
          const res = await page.evaluate((tag) => tag.innerText, tag);
          tagsReal.push(res);
        }
      } catch (error) {
        console.log(error);
      }

      console.log(tagsReal);

      const paragraphs = await contentRef.$$("p");

      // for(const p of paragraphs){
      //     try {

      //         const text = await page.evaluate(p => p.innerText, p);
      //         console.log(text);

      //     } catch (error) {

      //     }

      // }

      // console.log(title);
      // console.log(url);
      // console.log(contentRef);
    } catch (error) {}
  }

  await browser.close();
};

const juzne = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let articles = [];

  await page.goto(
    "https://www.juznevesti.com/Vesti-iz-juzne-Srbije-hronoloski.sr.html"
  );

  await page.waitForSelector(
    "div#content-wrapper > div.container.main_container_holder"
  );

  const dataRef = await page.$(
    "div#content-wrapper > div.container.main_container_holder > main.content > div.main.cf.item_details > div.lcol"
  );

  const articlesRef = await dataRef.$$(
    "div.list-by-date.mt20.mb20 > ul.article-list > li.ofh.mb5 > h3.list_by_date_title.title.article-list__title.dibvm.fz16"
  );

  let oldNews = 0;

  for (let i = 0; i < articlesRef.length; i++) {
    try {
      await page.goto(
        "https://www.juznevesti.com/Vesti-iz-juzne-Srbije-hronoloski.sr.html"
      );

      await page.waitForSelector(
        "div#content-wrapper > div.container.main_container_holder"
      );

      const dataRef = await page.$(
        "div#content-wrapper > div.container.main_container_holder > main.content > div.main.cf.item_details > div.lcol"
      );

      const articlesRef = await dataRef.$$(
        "div.list-by-date.mt20.mb20 > ul.article-list > li.ofh.mb5 > h3.list_by_date_title.title.article-list__title.dibvm.fz16"
      );

      const title = await articlesRef[i].$("a.dibvm");

      const titleText = await page.evaluate(
        (element) => element.getAttribute("title"),
        title
      );

      const link = await page.evaluate(
        (element) => element.getAttribute("href"),
        title
      );

      await page.goto(link);

      await page.waitForSelector(
        "div#content-wrapper > div.container.main_container_holder"
      );

      const mainRef = await page.$(
        "div#content-wrapper > div.container.main_container_holder > main.content > div.main.cf.item_details > div.lcol > div.article--single.cf.rel"
      );

      const contentRef = await mainRef.$(
        "div.article_core.cf > div.desc_holder.cf.main--content"
      );

      const tagsMainRef = await mainRef.$(
        "div.mb30 > p.p10.fz16.color--red.article-tags"
      );

      const tagsRef = await tagsMainRef.$$("a");

      const textRef = await contentRef.$$("p");

      let text = "";

      for (const c of textRef) {
        const res = await page.evaluate((c) => c.innerText, c);
        text += res;
      }

      let tags = [];

      for (const c of tagsRef) {
        const res = await page.evaluate((c) => c.innerText, c);
        tags.push(res.toLowerCase());
        tagsTotal.has(res.toLowerCase())
          ? tagsTotal.set(res.toLowerCase(), tagsTotal.get(res) + 1)
          : tagsTotal.set(res.toLowerCase(), 1);
      }

      const newArt = new Article(titleText, text, tags, "Juzne", "", link);
      articles.push(newArt);

      if (
        articlesDB.filter(
          (element) =>
            element.title === titleText && element.source === "Juzne Vesti"
        ).length === 0
      ) {
      let tt = await translate(titleText, {to: 'en'});

      let sent = await sentiment.getSentiment(tt.text);
        articlesDocRef
          .add({
            title: titleText,
            content: text,
            tags: tags,
            source: "Juzne Vesti",
            url: link,
            sentiment: sent.score,

          })
          .then((ref) => console.log("Added Document with ID: ", ref.id));
      } else {
        // console.log(sentiment(text));
        console.log('Already in DB!!!');
      oldNews += 1;
      }
    } catch (error) {}
  }

  console.log("Juzne finished loading " + articlesRef.length + " articles, " + articlesRef.length-oldNews + " of which are new");

  await browser.close();

  return dataRef;
};

class Article {
  title = "";
  content = "";
  tags = [];
  source = "";
  date = "";
  url = "";

  constructor(title, content, tags, source, date, url) {
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.source = source;
    this.date = date;
    this.url = url;
  }
}

// let allArticles = [];

const initDB = async () => {await getArticles(articlesDB); await getTags(tagsDB) };


const writeKeys = () =>{

        let allTags = new Map();

        let dbTags = [];
        const tagLists = articlesDB.map((element) => element.tags);
        dbTags = tagLists.flat();

        dbTags.map((res) =>
          allTags.has(res)
            ? allTags.set(res, allTags.get(res) + 1)
            : allTags.set(res, 1)
        );

        for (let k of allTags.keys()) {
          if (allTags.get(k) < 10) allTags.delete(k);
        }


        const keys = Array.from(allTags.keys());

        console.log(allTags);



        keys.forEach(key => {console.log(key);try{if (
          tagsDB.filter(
            (element) =>
              element.title === key
          ).length === 0
        ) {
          tagsDocRef
            .add({
              title: key,
            })
            .then((ref) => console.log("Added Document with ID: ", ref.id));
        } else {
          console.log('Already in DB!!!');
        }
      }catch(e){}});

        



}

// const initData = () =>
//   initDB()
//     .then(() => danas())
//     .then((articles) => allArticles.push(articles))
//     .then(() => juzne())
//     .then((articles) => allArticles.push(articles));

// initDB()
//   .then(() => initData())
//   .then(() => initDB())
//   .then(() => {
//     let allTags = new Map();

//     let dbTags = [];
//     const tagLists = articlesDB.map((element) => element.tags);
//     dbTags = tagLists.flat();

//     dbTags.map((res) =>
//       allTags.has(res)
//         ? allTags.set(res, allTags.get(res) + 1)
//         : allTags.set(res, 1)
//     );

//     // console.log(allTags);

//     for (let k of allTags.keys()) {
//       if (allTags.get(k) < 5) allTags.delete(k);
//     }

//     let keyNews = {};

//     allTags.forEach(
//       (v, k) => (keyNews[k] = articlesDB.filter((key) => key.tags.includes(k)))
//     );

//     console.log(keyNews);

//     return;
//   })
//   .then(() => {
//     return 0;
//   });

// danas();



const run = async () =>{
  await initDB();
  await Promise.all([juzne(), danas()]);
  await writeKeys();
  return 0;
}

run();