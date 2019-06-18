import ScratchStorage from 'scratch-storage';

import defaultProject from './default-project';

/**
 * Wrapper for ScratchStorage which adds default web sources.
 * @todo make this more configurable
 */
class Storage extends ScratchStorage {
    constructor () {
        super();
        this.cacheDefaultProject();
        // HACK: Use class property on myBlocks element to detect offline mode
        this.localUrl = window.location.href;
        this.localUrl = this.localUrl.substring(0, this.localUrl.lastIndexOf('/'));
        this.offlinemode = (document.getElementById("myBlocks").className == "offlinemode");
    }
    addOfficialScratchWebStores () {
        this.addWebStore(
            [this.AssetType.Project],
            this.getProjectGetConfig.bind(this),
            this.getProjectCreateConfig.bind(this),
            this.getProjectUpdateConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            this.getAssetGetConfig.bind(this),
            // We set both the create and update configs to the same method because
            // storage assumes it should update if there is an assetId, but the
            // asset store uses the assetId as part of the create URI.
            this.getAssetCreateConfig.bind(this),
            this.getAssetCreateConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.Sound],
            asset => `static/extension-assets/scratch3_music/${asset.assetId}.${asset.dataFormat}`
        );
    }
    setProjectHost (projectHost) {
        this.projectHost = projectHost;
    }
    getProjectGetConfig (projectAsset) {
        return `${this.projectHost}/${projectAsset.assetId}`;
    }
    getProjectCreateConfig () {
        return {
            url: `${this.projectHost}/`,
            withCredentials: true
        };
    }
    getProjectUpdateConfig (projectAsset) {
        return {
            url: `${this.projectHost}/${projectAsset.assetId}`,
            withCredentials: true
        };
    }
    setAssetHost (assetHost) {
        this.assetHost = assetHost;
    }
    getAssetGetConfig (asset) {
        return `${this.assetHost}/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`;
    }
    getAssetCreateConfig (asset) {
        return {
            // There is no such thing as updating assets, but storage assumes it
            // should update if there is an assetId, and the asset store uses the
            // assetId as part of the create URI. So, force the method to POST.
            // Then when storage finds this config to use for the "update", still POSTs
            method: 'post',
            url: `${this.assetHost}/${asset.assetId}.${asset.dataFormat}`,
            withCredentials: true
        };
    }
    setTranslatorFunction (translator) {
        this.translator = translator;
        this.cacheDefaultProject();
    }
    cacheDefaultProject () {
        const defaultProjectAssets = defaultProject(this.translator);
        defaultProjectAssets.forEach(asset => this.builtinHelper._store(
            this.AssetType[asset.assetType],
            this.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }
    // HACK: Override load in storage to get contents locally (offline mode)
    load (assetType, assetId, dataFormat) {

        // New promise to encapsulate XMLHttpRequest
        // Need because Fetch API used by default is not supported on file:// (prerequisite for Cordova)
        var makeRequest = function(method, url, format) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                if (format!="svg") xhr.responseType = "arraybuffer";
                xhr.open(method, url);
                xhr.onload = function () {
                    if (this.status == 0 || (this.status >= 200 && this.status < 300)) {
                        resolve((format!="svg")?new Uint8Array(xhr.response):new TextEncoder().encode(xhr.responseText));
                    } else {
                        reject({
                            status: this.status,
                            statusText: xhr.statusText
                        });
                    }
                };
                xhr.onerror = function () {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.send();
            });
        }

        if ( this.offlinemode && (assetType.runtimeFormat=="svg"||assetType.runtimeFormat=="wav"||assetType.runtimeFormat=="png")) {
            var url = this.localUrl+'/static/internal-assets/'+assetId+"."+assetType.runtimeFormat;
            var asset = new ScratchStorage.Asset(assetType, assetId);
            var dataFormat = assetType.runtimeFormat;
            const loadLocally = function() {
                return makeRequest('GET', url, dataFormat)
                    .then(function(response) {
                        asset.setData(response, dataFormat);
                        Promise.resolve(asset);
                    })
                    .catch(function(err) {
                        console.log("Error loading local resource "+url);
                        console.log(err);
                    })
            }
            return loadLocally().then(function() { return asset; });
        }
        return super.load(assetType, assetId, dataFormat);
    }
}

const storage = new Storage();

export default storage;
