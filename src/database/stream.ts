import { Persisted, InnerDatabase, Key, ENTITY_PARTITION, INDEX_PARTITION } from './types';

interface EntityStream<ENTITY> extends NodeJS.ReadableStream {
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: 'data', listener: (entity:ENTITY) => void): this;
}

export type Stream<ENTITY> = 
    (index:Key) => 
    EntityStream<ENTITY>;
    
type StreamFactory = 
    <ENTITY> (database:InnerDatabase<ENTITY>) => 
    Stream<ENTITY>;

export const stream:StreamFactory = ({ level }) => (index) => {
    return level.createReadStream({ 
        lt: [INDEX_PARTITION, index, undefined],
        gt: [INDEX_PARTITION, index, null],
    });
}