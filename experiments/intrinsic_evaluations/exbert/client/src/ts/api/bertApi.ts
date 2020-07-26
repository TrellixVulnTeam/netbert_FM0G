import * as d3 from 'd3';
import { debug } from 'util';
import { TokenDisplay } from '../data/TokenWrapper'
import * as tp from '../etc/types'
import * as R from 'ramda'
import { DemoAPI } from './demoAPI'
import * as hash from 'object-hash'
import { makeUrl, toPayload } from '../etc/apiHelpers'
import { URLHandler } from '../etc/URLHandler';

export const emptyTokenDisplay = new TokenDisplay()


const urlFormat = (host, port) => {
    // If location says `localhost` or diirectly a file, return correct server
    if (host == "localhost" || host == "") return "http://localhost:5000/api";
    const out = `http://${host}:${port}/api`
    console.log(out)
    return out;
}

const baseurl = URLHandler.basicURL()//urlFormat(window.location.hostname, 5000)

/**
 * Check if the route is present in the precompiled list of paths. Otherwise, return false
 */
function checkDemoAPI(toSend) {
    const hsh = hash.sha1(toSend);
    console.log("CHECKING DEMOAPI: " + hsh);
    if (DemoAPI.hasOwnProperty(hsh)) {
        // Relies on a symbolic link being present in the dist folder to the demo folder
        const path = './demo/' + DemoAPI[hsh]
        console.log("SENDING STATIC: ", path);
        return d3.json(path)
    }
    return false
}

type SentenceInfo = {
    sentenceA: string,
    sentenceB: string,
    layer: number,
};

export class BertAPI {

    constructor(private baseURL: string = null) {
        if (this.baseURL == null) {
            this.baseURL = baseurl+'/api';
        }
    }

    getMetaAttentions(sentenceA: string, layer: number, sentenceB = "", hashObj:{}|null=null): Promise<tp.AttentionMetaResponse> {
        const toSend: SentenceInfo = {
            sentenceA: sentenceA,
            sentenceB: sentenceB,
            layer: layer
        };

        const url = makeUrl(this.baseURL + "/attend+meta", toSend)
        console.log("--- GET " + url);

        // Add hash and value to hashObj
        if (hashObj != null) {
            const key = hash.sha1(toSend)
            d3.json(url).then(r => {
                hashObj[key] = r;
            })
        }

        return checkDemoAPI(toSend) || d3.json(url)
    }

    updateMaskedMetaAttentions(a: TokenDisplay, layer: number, b: TokenDisplay = emptyTokenDisplay, hashObj:{}|null=null): Promise<tp.AttentionMetaMaskedResponse> {

        const toSend = {
            tokensA: R.map(R.prop('text'), a.tokenData),
            tokensB: R.map(R.prop('text'), b.tokenData),

            // Empty masks need to be sent as a number, unfortunately. Choosing -1 for this
            maskA: a.maskInds.length ? a.maskInds : [-1],
            maskB: b.maskInds.length ? b.maskInds : [-1],
            layer: layer,
        }

        const url = makeUrl(this.baseURL + '/update-meta-mask');
        const payload = toPayload(toSend)

        // Add hash and value to hashObj
        if (hashObj != null) {
            const key = hash.sha1(toSend)
            d3.json(url, payload).then(r => {
                hashObj[key] = r;
            })
        }

        console.log("--- POST " + url, payload);

        return checkDemoAPI(toSend) || d3.json(url, payload)
    }

    /**
     * 
     * @param embedding Embedding of the word
     * @param layer In the l'th layer
     * @param k how many results to retrieve
     */
    getNearestWozEmbeddings(embedding: number[], layer: number, heads: number[], k = 10, hashObj:{}|null=null): Promise<tp.FaissSearchResults[]> {
        const toSend = {
            embedding: embedding,
            layer: layer,
            heads: heads,
            k: k,
        }

        const url = makeUrl(this.baseURL + '/woz-k-nearest-embeddings', toSend);
        console.log("--- GET " + url);

        if (hashObj != null) {
            const key = hash.sha1(toSend)
            d3.json(url).then(r => {
                hashObj[key] = r;
            })
        }

        return checkDemoAPI(toSend) || d3.json(url)
    }

    getNearestWozContexts(context: number[], layer: number, heads: number[], k = 10, hashObj:{}|null=null): Promise<tp.FaissSearchResults[]> {
        const toSend = {
            context: context,
            layer: layer,
            heads: heads,
            k: k,
        }

        const url = makeUrl(this.baseURL + '/woz-k-nearest-contexts', toSend);
        console.log("--- GET " + url);

        if (hashObj != null) {
            const key = hash.sha1(toSend)
            d3.json(url).then(r => {
                hashObj[key] = r;
            })
        }

        return checkDemoAPI(toSend) || d3.json(url)
    }
};
