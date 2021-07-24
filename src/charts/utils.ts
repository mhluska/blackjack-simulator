import { GameSettings } from '../game';
import { BasicStrategyChart, UncommonChart } from '../types';
import {
  d1h17DasChart,
  d1s17DasChart,
  d1h17DasUncommon,
  d1s17DasUncommon,
  d2h17DasChart,
  d2s17DasChart,
  d2h17DasUncommon,
  d2s17DasUncommon,
  dMultiH17DasChart,
  dMultiS17DasChart,
  dMultiH17DasUncommon,
  dMultiS17DasUncommon,
} from '.';

export default function selectCharts(
  settings: GameSettings
): { chart: BasicStrategyChart; uncommon: UncommonChart } {
  if (settings.deckCount === 1) {
    if (settings.hitSoft17) {
      return { uncommon: d1h17DasUncommon, chart: d1h17DasChart };
    } else {
      return { uncommon: d1s17DasUncommon, chart: d1s17DasChart };
    }
  }

  if (settings.deckCount === 2) {
    if (settings.hitSoft17) {
      return { uncommon: d2h17DasUncommon, chart: d2h17DasChart };
    } else {
      return { uncommon: d2s17DasUncommon, chart: d2s17DasChart };
    }
  }

  if (settings.hitSoft17) {
    return { uncommon: dMultiH17DasUncommon, chart: dMultiH17DasChart };
  } else {
    return { uncommon: dMultiS17DasUncommon, chart: dMultiS17DasChart };
  }
}
