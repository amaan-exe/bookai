import { pipeline, env } from '@xenova/transformers';

// Skip local model checks since we are running in browser and want to fetch from HF hub
env.allowLocalModels = false;

class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'init') {
        try {
            await PipelineSingleton.getInstance(x => {
                self.postMessage({ type: 'progress', data: x });
            });
            self.postMessage({ type: 'ready' });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
    } else if (message.type === 'embed') {
        try {
            const extractor = await PipelineSingleton.getInstance();
            const { texts, id } = message.data;
            const output = await extractor(texts, { pooling: 'mean', normalize: true });
            const embeddings = output.tolist();
            self.postMessage({ type: 'embed_result', data: { id, embeddings } });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
        }
    }
});
