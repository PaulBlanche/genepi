const levelup = require('levelup');
import encoding from 'encoding-down';
import memdown from 'memdown';
import * as bytewise from 'bytewise';
import { v4 as uuid } from 'uuid';

const tape = require('tap');

import { put } from './put';
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

tape.test('put without indexers', async (t:any) => {
    const database = open([]);
    const entity = { order: 1, tags: ['tag1', 'tag2'] };
    const { _key, _indexes } = await put(database)(entity);
    const found = await database.level.get([ENTITY_PARTITION, _key]);
    t.same({...entity, _key, _indexes }, found, `should put given entity at ['entity', key]`)

    const stream = database.level.createReadStream();
    let count = 0;
    stream.on('data', ({ key, value }:any) => {
        count++;
    });
    return new Promise((res, rej) => {
        stream.on('end', () => {
            t.equals(count, 1, 'should not put anything else');
            res();
        });
        stream.on('error', rej);
    });
});

tape.test('put with indexers', async (t:any) => {
    const database = open([
        (entity, emit) => emit(['order', entity.order]),
        (entity, emit) => entity.tags.forEach(tag => emit(['tag', tag])),
    ]);
    const entity = { order: 1, tags: ['tag1', 'tag2'] };
    const { _key, _indexes } = await put(database)(entity);
    const found = await database.level.get([ENTITY_PARTITION, _key]);
    t.same({...entity, _key, _indexes }, found, `should put given entity at ['entity', key]`)

    const index1 = await database.level.get([INDEX_PARTITION, ['order', 1], _key]);
    t.same(index1, _key, `should put key in one-to-one index`);

    const index2 = await database.level.get([INDEX_PARTITION, ['tag', 'tag1'], _key]);
    t.same(index2, _key, `should put key in many-to-one index (first key)`);

    const index3 = await database.level.get([INDEX_PARTITION, ['tag', 'tag2'], _key]);
    t.same(index3, _key, `should put key in many-to-one index (second key)`);

    const stream = database.level.createReadStream();
    let count = 0;
    stream.on('data', ({ key, value }:any) => {
        count++;
    });
    return new Promise((res, rej) => {
        stream.on('end', () => {
            t.equals(count, 4, 'should not put anything else');
            res();
        });
        stream.on('error', rej);
    });
});

tape.test('put an updated persisted entity', async (t:any) => {
    const database = open([]);
    const entity = { order: 1, tags: ['tag1', 'tag2'] };
    const persisted = await put(database)(entity);
    const updated = { order: 2, tags: ['tag1', 'tag3'] };
    
    const persistedAgain = await put(database)({
        ... persisted,
        ... updated,
    } as Entity);
        
    t.notSame(persistedAgain._key, persisted._key, 'should persist again with another key');
    
    const foriginal = await database.level.get([ENTITY_PARTITION, persisted._key]);
    t.same(foriginal, persisted, 'should not replace persisted');

    const fupdated = await database.level.get([ENTITY_PARTITION, persistedAgain._key]);
    t.same(fupdated, persistedAgain, 'should insert updated');
});
