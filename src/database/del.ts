import { Persisted, InnerDatabase, Key, ENTITY_PARTITION, INDEX_PARTITION } from './types';

export type Del<ENTITY> = 
    (persisted:Persisted<ENTITY>) => 
    Promise<void>;
    
type DelFactory = 
    <ENTITY> (database:InnerDatabase<ENTITY>) => 
    Del<ENTITY>;

//noop if key not found
export const del:DelFactory = ({ level }) => async (persisted) => {
    await level.del([ENTITY_PARTITION, persisted._key]);
    for (const index of persisted._indexes) {
        await level.del([INDEX_PARTITION, index, persisted._key]);
    }
}