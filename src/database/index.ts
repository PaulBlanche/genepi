import { put, Put } from './put';
import { get, Get } from './get';
import { del, Del } from './del';
import { stream, Stream } from './stream';

import { InnerDatabase } from './types';

export type Database<ENTITY> = {
    put: Put<ENTITY>;
    get: Get<ENTITY>;
    del: Del<ENTITY>;
    stream: Stream<ENTITY>;
};

type Builder = <ENTITY> (database:InnerDatabase<ENTITY>) => Database<ENTITY> 

export const builder:Builder =(database) => ({
    get: get(database),
    put: put(database),
    del: del(database),
    stream: stream(database),
});