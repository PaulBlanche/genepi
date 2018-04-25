import { Persisted, InnerDatabase, Key, ENTITY_PARTITION } from './types';

export type Get<ENTITY> = 
    (key:Key) => 
    Promise<Persisted<ENTITY>>;
    
type GetFactory = 
    <ENTITY> (database:InnerDatabase<ENTITY>) => 
    Get<ENTITY>;

// throw if key not found
export const get:GetFactory = ({ level }) => async (key) => {
    return level.get([ENTITY_PARTITION, key]);
}