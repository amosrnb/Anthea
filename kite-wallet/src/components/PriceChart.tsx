import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { chartPaths } from '../lib/data';
import { colors } from '../lib/theme';

const H = 180;

/** Token price chart (USD history), drawn taller than the portfolio sparkline. Empty while loading or unavailable. */
export function PriceChart({ values }: { values: number[] | null }) {
  const [w, setW] = useState(0);
  const paths = useMemo(() => (w && values ? chartPaths(values, w, H) : null), [values, w]);

  return (
    <View style={{ alignSelf: 'stretch', height: H, marginTop: 18 }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {paths && (
        <Svg width={w} height={H} style={{ overflow: 'visible' }}>
          <Defs>
            <LinearGradient id="kiteTokenChartFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.28} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={paths.area} fill="url(#kiteTokenChartFill)" />
          <Path d={paths.line} fill="none" stroke={colors.accent} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}
