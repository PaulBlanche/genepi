type Level = {
    put: Function;
    get: Function;
    del: Function;
    createReadStream: Function
}; 

export type Persisted<ENTITY> = {
    _key: Key,
    _indexes: Key[];
} & ENTITY;

export type Key = (string|number|boolean)[];

export type Keyer<ENTITY> = (entity:ENTITY) => Key;
export type Emitter = (index:Key) => void;
export type Indexer<ENTITY> = (entity:ENTITY, emit:Emitter) => void;

export type InnerDatabase<ENTITY> = {
    level: Level;
    keyer: Keyer<ENTITY>
    indexers: Indexer<ENTITY>[];
}

export const ENTITY_PARTITION = 'entity';
export const INDEX_PARTITION = 'index';