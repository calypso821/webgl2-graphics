export class ImageLoader {
    // load image - rename

    async load(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        return imageBitmap;
    }

    async loadAssets(url) {
        const filename = url.split('/').pop().split('.');
        const imageBitmap = await this.load(url);
        return { [filename[0]]: imageBitmap };
    }

}
