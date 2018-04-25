import { Persisted, InnerDatabase, Key, Emitter, ENTITY_PARTITION, INDEX_PARTITION } from './types';

export type Put<ENTITY> = 
    (entity:ENTITY) => 
    Promise<Persisted<ENTITY>>;
    
type PutFactory = 
    <ENTITY> (database:InnerDatabase<ENTITY>) => 
    Put<ENTITY>;


//replace if key already exists
export const put:PutFactory = ({ level, keyer, indexers }) => async (entity) => {
    const _key = keyer(entity);
    const _indexes:Key[] = [];
    const persisted = Object.assign(entity, {  _key, _indexes });
    const emitter:Emitter = (key:Key) => { _indexes.push(key); };
    indexers.forEach(indexer => {
        indexer(entity, emitter);
    });
    await level.put([ENTITY_PARTITION, persisted._key], persisted);
    for (const index of persisted._indexes) {
        await level.put([INDEX_PARTITION, index, persisted._key], persisted._key);
    }
    return persisted;
}