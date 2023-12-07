import fs from 'fs/promises';
import crypto from 'crypto';
import { read } from 'fs';


const processModelsJson = async (path) => {
    const data = await fs.readFile(path, 'utf-8');
    const models = JSON.parse(data);
    for (const model of models) {
        for (const [downloadType, download] of Object.entries(model.downloads)) {
            const response = await fetch(download.url);

            download.size = response.headers.get('Content-Length');

            if (typeof download.md5 === 'undefined') {
                console.log(`Processing ${model.name} ${downloadType}`);

                const hash = crypto.createHash('md5');
                const reader = response.body.getReader();
                let readBytes = 0;
                let progress = 0;
                while (true) {
                    const { done, value } = await reader.read();
                    readBytes += value?.length || 0;
                    progress = readBytes / download.size;
                    // display progress rounded to 2 decimal places and on one line
                    process.stdout.write(`Progress: ${Math.round(progress * 10000) / 100}% \r`);
                    if (done) break;
                    hash.update(value);
                }
                const md5 = hash.digest('hex');
                download.md5 = md5;
            }
        }
    }
    await fs.writeFile(path, JSON.stringify(models, null, 4));
}

processModelsJson(process.argv[2] || 'models.json');
