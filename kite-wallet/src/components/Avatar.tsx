import Svg, { Rect } from 'react-native-svg';
import { View } from 'react-native';

import { AVATAR } from '../lib/data';
import { colors } from '../lib/theme';

/** 32 pt indigo tile with the 7×7 pixel-art face (4 pt pixels). */
export function Avatar() {
  return (
    <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={28} height={28} viewBox="0 0 7 7">
        {AVATAR.map((on, i) => (on ? <Rect key={i} x={i % 7} y={Math.floor(i / 7)} width={1.02} height={1.02} fill={colors.white} /> : null))}
      </Svg>
    </View>
  );
}
