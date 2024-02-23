/*
 * Copyright 2023 lspriv. All Rights Reserved.
 * Distributed under MIT license.
 * See File LICENSE for detail or copy at https://opensource.org/licenses/MIT
 * @Description: 处理组件marks属性的插件
 * @Author: lspriv
 * @LastEditTime: 2024-02-24 06:25:21
 */
import { normalDate, formDateByStrKey, getMarkKey } from '../interface/calendar';

import type { Nullable } from '../utils/shared';
import type { Plugin, TrackDateResult } from '../basic/service';
import type { CalendarMark, CalendarDay, WcMarkDict, WcMarkMap, WcScheduleInfo } from '../interface/calendar';
import type { CalendarInstance } from '../interface/component';

export class MarkPlugin implements Plugin {
  public static KEY = 'mark' as const;

  private _marks_: WcMarkMap;

  public update(instance: CalendarInstance, marks: Array<CalendarMark>) {
    const map: WcMarkMap = new Map();

    for (let i = 0; i < marks.length; i++) {
      const mark = marks[i];
      const date = mark.date ? normalDate(mark.date) : normalDate(+mark.year!, +mark.month!, +mark.day!);
      const key = `${date.year}_${date.month}_${date.day}`;
      const _mark = map.get(key);
      if (_mark) {
        if (mark.type === 'schedule') {
          if (_mark.schedule) _mark.schedule.push(mark);
          else _mark.schedule = [mark];
        } else {
          _mark[mark.type] = mark;
        }
      } else {
        const form = mark.type === 'schedule' ? { schedule: [mark] } : { [mark.type]: mark };
        map.set(key, form as WcMarkDict);
      }
    }

    const deletes = this._marks_
      ? [...this._marks_.entries()].flatMap(([key]) => {
          return map.has(key) ? [] : formDateByStrKey(key);
        })
      : [];

    const updates = [...map.keys()].map(key => formDateByStrKey(key));

    this._marks_ = map;

    if (instance._loaded_) instance._calendar_.service.updateDates([...updates, ...deletes]);
  }

  public PLUGIN_TRACK_DATE(date: CalendarDay): Nullable<TrackDateResult> {
    if (!this._marks_) return null;

    const key = `${date.year}_${date.month}_${date.day}`;
    const mark = this._marks_.get(key);
    if (mark) {
      const result: TrackDateResult = {};

      if (mark.corner) result.corner = { text: mark.corner.text, color: mark.corner.color };
      if (mark.festival) result.festival = { text: mark.festival.text, color: mark.festival.color };
      if (mark.schedule) {
        result.schedule = mark.schedule.map((schedule, i) => ({
          text: schedule.text,
          color: schedule.color,
          bgColor: schedule.bgColor,
          key: getMarkKey(key, MARK_PLUGIN_KEY)
        }));
      }
      return result;
    }

    return null;
  }

  PLUGIN_TRACK_SCHEDULE(id?: string): Nullable<WcScheduleInfo> {
    if (!id) return null;
    const date = formDateByStrKey(id!);
    const month = date.month - 1;
    return {
      dtStart: new Date(date.year, month, date.day),
      dtEnd: new Date(date.year, month, date.day + 1),
      origin: '自定义'
    };
  }
}

export const MARK_PLUGIN_KEY = MarkPlugin.KEY;
