import { assertEquals } from '@std/assert';
import { select, str2time, time2timestamp } from '../datetime.ts';

Deno.test('datetime', async (t) => {
  await t.step('[str2time] should return false if shorter than 4 characters', () => {
    const str = '20';

    const time = str2time(str);

    assertEquals(time, false);
  });

  await t.step('[str2time] should parse a year', () => {
    const str = '2016';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
    });
  });

  await t.step('[str2time] should parse a year and month', () => {
    const str = '2016-06';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '06',
    });
  });

  await t.step('[str2time] should parse a year, month and day', () => {
    const str = '2016-06-05';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '06',
      day: '05',
    });
  });

  await t.step('[str2time] should parse a year, month, day and hour', () => {
    const str = '2016-06-05 20';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '06',
      day: '05',
      hour: '20',
    });
  });

  await t.step('[str2time] should parse a year, month, day, hour and minute', () => {
    const str = '2016-06-05 20:34';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '06',
      day: '05',
      hour: '20',
      minute: '34',
    });
  });

  await t.step('[str2time] should parse a year, month, day, hour, minute and second', () => {
    const str = '2016-06-05 20:34:54';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '06',
      day: '05',
      hour: '20',
      minute: '34',
      second: '54',
    });
  });

  await t.step('[str2time] should parse a year, month, day, hour, minute, second and timezone', () => {
    const str = '2016-06-05 20:34:54+01:00';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '06',
      day: '05',
      hour: '20',
      minute: '34',
      second: '54',
      timezone: '+01:00',
    });
  });

  await t.step('[str2time] should parse a year range', () => {
    const str = '2016|2017';

    const time = str2time(str);

    assertEquals(time, {
      year: ['2016', '2017'],
    });
  });

  await t.step('[str2time] should parse a month range', () => {
    const str = '2016-01|02';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: ['01', '02'],
    });
  });

  await t.step('[str2time] should parse a day range', () => {
    const str = '2016-01-03|04';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '01',
      day: ['03', '04'],
    });
  });

  await t.step('[str2time] should parse a hour range', () => {
    const str = '2016-01-03 10|22';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '01',
      day: '03',
      hour: ['10', '22'],
    });
  });

  await t.step('[str2time] should parse a minute range', () => {
    const str = '2016-01-03 10:44|46';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '01',
      day: '03',
      hour: '10',
      minute: ['44', '46'],
    });
  });

  await t.step('[str2time] should parse a second range', () => {
    const str = '2016-01-03 10:44:23|51';

    const time = str2time(str);

    assertEquals(time, {
      year: '2016',
      month: '01',
      day: '03',
      hour: '10',
      minute: '44',
      second: ['23', '51'],
    });
  });

  await t.step('[Manual] should compile manual time for a year source', () => {
    const sources = {
      manual: {
        year: '2016',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');

    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2016-01-01T00:00:00.000Z');
  });

  await t.step('[Manual] should compile manual time for a year and month source', () => {
    const sources = {
      manual: {
        year: '2015',
        month: '06',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2015-06-01T00:00:00.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month and day source', () => {
    const sources = {
      manual: {
        year: '2014',
        month: '12',
        day: '31',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2014-12-31T00:00:00.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day and hour source', () => {
    const sources = {
      manual: {
        year: '2013',
        month: '01',
        day: '01',
        hour: '12',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2013-01-01T12:00:00.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour and minute source', () => {
    const sources = {
      manual: {
        year: '2012',
        month: '02',
        day: '28',
        hour: '23',
        minute: '49',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2012-02-28T23:49:00.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute and second source', () => {
    const sources = {
      manual: {
        year: '2011',
        month: '11',
        day: '03',
        hour: '00',
        minute: '00',
        second: '37',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'local');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2011-11-03T00:00:37.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute and second in dst source', () => {
    const sources = {
      manual: {
        year: '2011',
        month: '06',
        day: '03',
        hour: '01',
        minute: '00',
        second: '37',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'local');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2011-06-03T00:00:37.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute, second and timezone without dst source', () => {
    const sources = {
      manual: {
        year: '2010',
        month: '01',
        day: '02',
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '+01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2010-01-02T02:04:05.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute, second and timezone with dst source', () => {
    const sources = {
      manual: {
        year: '2009',
        month: '06',
        day: '02',
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '+01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2009-06-02T01:04:05.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute, second and timezone #2 with dst source', () => {
    const sources = {
      manual: {
        year: '2008',
        month: '06',
        day: '02',
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '+02:30',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2008-06-01T23:34:05.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute, second and timezone #3 with dst source', () => {
    const sources = {
      manual: {
        year: '2007',
        month: '06',
        day: '02',
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '-01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2007-06-02T03:04:05.000Z');
  });

  await t.step('[Manual] should compile manual time for a year, month, day, hour, minute, second and timezone #3 without dst source', () => {
    const sources = {
      manual: {
        year: '2007',
        month: '01',
        day: '02',
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '-01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2007-01-02T04:04:05.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year source', () => {
    const sources = {
      manual: {
        year: ['2016', '2017'],
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2016-01-01T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year and month source', () => {
    const sources = {
      manual: {
        year: ['2015', '2016'],
        month: ['06', '07'],
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2015-01-01T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month and day source', () => {
    const sources = {
      manual: {
        year: '2014',
        month: ['11', '12'],
        day: ['28', '31'],
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2014-11-01T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day and hour source', () => {
    const sources = {
      manual: {
        year: ['2013', '2014'],
        month: ['01', '06'],
        day: ['01', '30'],
        hour: ['12', '23'],
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2013-01-01T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour and minute source', () => {
    const sources = {
      manual: {
        year: ['2012', '2017'],
        month: ['02', '12'],
        day: '28',
        hour: '23',
        minute: ['49', '53'],
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2012-01-01T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute and second source', () => {
    const sources = {
      manual: {
        year: '2011',
        month: '11',
        day: ['03', '06'],
        hour: '00',
        minute: '00',
        second: '37',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2011-11-03T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute and second in dst source', () => {
    const sources = {
      manual: {
        year: '2011',
        month: '06',
        day: ['03', '08'],
        hour: '01',
        minute: '00',
        second: '37',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2011-06-03T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute, second and timezone without dst source', () => {
    const sources = {
      manual: {
        year: '2010',
        month: ['01', '07'],
        day: '02',
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '+01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2010-01-01T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute, second and timezone with dst source', () => {
    const sources = {
      manual: {
        year: '2009',
        month: '06',
        day: '02',
        hour: ['03', '09'],
        minute: '04',
        second: '05',
        timezone: '+01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2009-06-02T03:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute, second and timezone #2 with dst source', () => {
    const sources = {
      manual: {
        year: '2008',
        month: '06',
        day: '02',
        hour: ['03', '12'],
        minute: '04',
        second: ['05', '09'],
        timezone: '+02:30',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2008-06-02T03:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute, second and timezone #3 with dst source', () => {
    const sources = {
      manual: {
        year: '2007',
        month: '06',
        day: ['02', '12'],
        hour: '03',
        minute: '04',
        second: '05',
        timezone: '-01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2007-06-02T00:00:00.000Z');
  });

  await t.step('[Manual with ranges] should compile manual time for a year, month, day, hour, minute, second and timezone #3 without dst source', () => {
    const sources = {
      manual: {
        year: '2007',
        month: '01',
        day: '02',
        hour: '03',
        minute: '04',
        second: ['05', '59'],
        timezone: '-01:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.manual, type: 'manual' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'manual');
    assertEquals(timestamp.quality, 'fuzzy');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2007-01-02T03:04:05.000Z');
  });

  await t.step('[GPS] should compile gps time for a year, month, day, hour, minute, second', () => {
    const sources = {
      gps: {
        year: '2006',
        month: '06',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
        timezone: '+00:00',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.gps, type: 'gps' });

    const timestamp = time2timestamp(item.time, { type: item.type });

    assertEquals(timestamp.type, 'gps');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-06-02T06:54:05.000Z');
  });

  await t.step('[Device type unknown] should compile device time without DST', () => {
    const sources = {
      device: {
        year: '2006',
        month: '06',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
        deviceAutoDst: false,
        deviceType: 'unknown',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.device, type: 'device' });

    const timestamp = time2timestamp(item.time, { type: item.type, deviceAutoDst: false });

    assertEquals(timestamp.type, 'device');
    assertEquals(timestamp.quality, 'local');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-06-02T06:54:05.000Z');
  });

  await t.step('[Device type unknown] should compile device time with DST', () => {
    const sources = {
      device: {
        year: '2006',
        month: '06',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.device, type: 'device' });

    const timestamp = time2timestamp(item.time, { type: item.type, deviceAutoDst: true });

    assertEquals(timestamp.type, 'device');
    assertEquals(timestamp.quality, 'local');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-06-02T05:54:05.000Z');
  });

  await t.step('[Device type offset_fixed] should compile device time without DST in DST time frame', () => {
    const sources = {
      device: {
        year: '2006',
        month: '06',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.device, type: 'device' });

    const timestamp = time2timestamp(item.time, { type: item.type, deviceAutoDst: false, deviceUtcOffset: 3600 });

    assertEquals(timestamp.type, 'device');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-06-02T05:54:05.000Z');
  });

  await t.step('[Device type offset_fixed] should compile device time without DST outside DST timeframe', () => {
    const sources = {
      device: {
        year: '2006',
        month: '01',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.device, type: 'device' });

    const timestamp = time2timestamp(item.time, { type: item.type, deviceAutoDst: false, deviceUtcOffset: 3600 });

    assertEquals(timestamp.type, 'device');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-01-02T05:54:05.000Z');
  });

  await t.step('[Device type offset_fixed] should compile device time with DST in DST time frame', () => {
    const sources = {
      device: {
        year: '2006',
        month: '06',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.device, type: 'device' });

    const timestamp = time2timestamp(item.time, { type: item.type, deviceAutoDst: true, deviceUtcOffset: 3600 * 2 });

    assertEquals(timestamp.type, 'device');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-06-02T03:54:05.000Z');
  });

  await t.step('[Device type offset_fixed] should compile device time with DST outside DST timeframe', () => {
    const sources = {
      device: {
        year: '2006',
        month: '01',
        day: '02',
        hour: '06',
        minute: '54',
        second: '05',
      },
    };

    const item = select(sources);

    assertEquals(item, { time: sources.device, type: 'device' });

    const timestamp = time2timestamp(item.time, { type: item.type, deviceAutoDst: true, deviceUtcOffset: 3600 });

    assertEquals(timestamp.type, 'device');
    assertEquals(timestamp.quality, 'utc');
    assertEquals(new Date(timestamp.timestamp * 1000).toISOString(), '2006-01-02T05:54:05.000Z');
  });
});
