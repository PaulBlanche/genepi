const levelup = require('levelup');
import encoding from 'encoding-down';
import memdown from 'memdown';
import * as bytewise from 'bytewise';
import { v4 as uuid } from 'uuid';

const tape = require('tap');

import { put } from './put';
import { del } from './del';
import { Indexer, INDEX_PARTITION, ENTITY_PARTITION } from './types';

type Entity = {
    order: number;
    tags: string[];
}

const open = (indexers:Indexer<Entity>[]) => {
    const level = levelup(encoding(memdown(), { valueEncoding: 'json', keyEncoding: bytewise }));    
    return {
        level,
        keyer: () => [uuid()],
        indexers,
    };
};

tape.test('del an entity', async (t:any) => {
    const database = open([]);
    const entity = { order: 1, tags: ['tag1', 'tag2'] };
    const persisted = await put(database)(entity);
    
    await del(database)(persisted);
    
    const stream = database.level.createReadStream();
    let count = 0;
    stream.on('data', ({ key, value }:any) => {
        count++;
    });
    return new Promise((res, rej) => {
        stream.on('end', () => {
            t.equals(count, 0, 'should delete entity and indexes');
            res();
        });
        stream.on('error', rej);
    });
});

tape.test('del an entity already deleted', async (t:any) => {
    const database = open([]);
    const entity = { order: 1, tags: ['tag1', 'tag2'] };
    const persisted = await put(database)(entity);
    
    await del(database)(persisted);
    await t.resolves(() => del(database)(persisted), 'should do nothing');
});
