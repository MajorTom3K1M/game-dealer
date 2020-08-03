const cheerio = require('cheerio');
const got = require('got');
const sanitize = require('sanitize-html');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('set-cookie-parser');
const tough = require('tough-cookie');
const app = express();

app.use(bodyParser.json());

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
    console.log(`listen to port ${app.get('port')}`);
});

app.get('/allyouplay', (req, res) => {
    const { q } = req.query;
    got(`https://www.allyouplay.com/en/search?q=${q}`).then(async (gotResponse) => {
        var body = gotResponse.body;
        if (gotResponse.statusCode !== 200) return res.status(400).send({ errorMessage: 'AllYouPlay currently unavailable!' });

        let $ = cheerio.load(body);
        let gameTitle = $('.category-products-grid .box-product-name').toArray().map((item) => item.children[0].data);
        let platForm = $('.category-products-grid .box-product-platforms .box-product-platform-image').toArray().map((item) => item.attribs.title);
        let currentPrice = $('.category-products-grid .box-product-price').children('span').toArray().map(item => item.children[0].data);
        let oldPrice = $('.category-products-grid .box-product-price').children('del').toArray().map(item => item.children[0].data);
        let cutPrice = $('.category-products-grid .box-product-discount').toArray().map(item => item.children[0].data.replace("\n", ""));
        let link = $('.category-products-grid .box.box-product').toArray().map(item => `https://www.allyouplay.com${item.attribs.href}`);

        let response = [];
        for (let i in gameTitle) {
            response.push({
                title: gameTitle[i] ? gameTitle[i] : "",
                drm: platForm[i] ? platForm[i] : "",
                currentPrice: currentPrice[i] ? currentPrice[i] : oldPrice[i],
                oldPrice: oldPrice[i] ? oldPrice[i] : currentPrice[i] ? currentPrice[i] : "",
                priceCut: cutPrice[i] ? cutPrice[i] : "",
                link: link[i] ? link[i] : "",
                shop: {
                    id: "allyouplay",
                    name: "AllYouPlay"
                }
            })
        }

        res.status(200).send(response);
    });
});

app.get('/dlgamer', async (req, res) => {
    const { q } = req.query;
    const request = got.extend({
        cookieJar: new tough.CookieJar()
    });
    request.get(`https://www.dlgamer.com/`).then((t) => {
        request.get(`https://www.dlgamer.com/us/api/autocomplete-search?query=${q}`).then((gotResponse) => {
            const searchResponse = JSON.parse(gotResponse.body);
            const OS = {
                1: "windows"
            }
            const DRM = {
                4: "steam",
                5: "origin",
                6: "uplay",
                10: "rockstar",
                11: "gog"
            }
            let response = [];
            for (let i in searchResponse) {
                response.push({
                    title: searchResponse[i].name,
                    drm: DRM[searchResponse[i].drm] ? DRM[searchResponse[i].drm] : "",
                    currentPrice: searchResponse[i].price,
                    oldPrice: searchResponse[i].pricestrike,
                    priceCut: searchResponse[i].percent,
                    link: searchResponse[i].link,
                    shop: {
                        id: "dlgamer",
                        name: "DLGamer"
                    }
                });
            }
            res.status(200).send(response);
        });
    })
});

app.get('/steam', (req, res) => {
    const { q } = req.query;
    got(`https://store.steampowered.com/search/?term=${q}`).then((gotResponse) => {
        var body = gotResponse.body;
        if (gotResponse.statusCode !== 200) return res.status(400).send({ errorMessage: 'AllYouPlay currently unavailable!' });

        const DRM  = {
            "win": "windows",
            "linux": "linux",
            "mac": "mac"
        } 

        let $ = cheerio.load(body);
        let appLink = $(`.search_result_row.ds_collapse_flag`).toArray().map((elem) => elem.attribs['href']);
        let appName = $(`.search_result_row.ds_collapse_flag .title`).toArray().map((elem) => elem.children[0].data );
        let priceCut = $(`.search_result_row.ds_collapse_flag .search_price_discount_combined .search_discount`)
            .toArray().map(elem => (elem.children[0].next ? elem.children[0].next.children[0].data : ""));
        let appOldPrice = $(`.search_result_row.ds_collapse_flag .search_price_discount_combined .search_price`)
            .toArray().map((elem) => elem.children[0].next ? elem.children[0].next.children[0].children[0].data : "" );
        let appCurrentPrice = $(`.search_result_row.ds_collapse_flag .search_price_discount_combined .search_price`)
            .toArray().map((elem) => elem.children[0].data.replace(/[\r\n" "]+/g,"") ? elem.children[0].data.replace(/[\r\n" "]+/g,"") : '');
        // let response = [];

        console.log(appName);
        console.log(priceCut);
        console.log(appOldPrice);
        console.log(appCurrentPrice);
        console.log(appLink);
        res.status(200).send(appLink)
    })
});