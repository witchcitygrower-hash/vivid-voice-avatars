export interface ModelOption {
  id: string;
  name: string;
  params: string;
  size: string;
  vram: string;
  description: string;
  quality: 1 | 2 | 3 | 4 | 5;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini',
    params: '3.8B',
    size: '~2.4GB',
    vram: '~3.7GB',
    description: 'Best quality — Microsoft\'s strongest small model',
    quality: 5,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    params: '3B',
    size: '~1.8GB',
    vram: '~3GB',
    description: 'Great reasoning — Meta\'s latest compact model',
    quality: 4,
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B',
    params: '3B',
    size: '~1.8GB',
    vram: '~3GB',
    description: 'Strong multilingual — Alibaba\'s versatile model',
    quality: 4,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B',
    params: '1.7B',
    size: '~1GB',
    vram: '~2GB',
    description: 'Efficient — HuggingFace\'s optimized small model',
    quality: 3,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    params: '1.5B',
    size: '~1GB',
    vram: '~2GB',
    description: 'Good balance — fast with decent quality',
    quality: 3,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    params: '1B',
    size: '~700MB',
    vram: '~1.5GB',
    description: 'Fast & light — good for quick responses',
    quality: 2,
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 0.5B',
    params: '0.5B',
    size: '~350MB',
    vram: '~1GB',
    description: 'Ultra-light — fastest download, basic quality',
    quality: 1,
  },
];

export const DEFAULT_MODEL_ID = 'Phi-3.5-mini-instruct-q4f16_1-MLC';
