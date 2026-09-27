import { Children, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NEG, POS } from '../data';
import { BigBtn, Btn, Cta, f, Header, HeaderTitle, KvRows, MUTED, Overline, p, PrimaryCta, Screen, Scroll, TNUM, Txt, useBottomExtra } from '../ui';
import { PHRASE_BADGES } from '../platform/screenCapture';
import type { Wallet } from '../useWallet';
import { WordGrid } from './Onboarding';

const PageTitle = ({ children, pad }: { children: string; pad: [number, number, number] }) => (
  <Txt accessibilityRole="header" style={[f(900, 28), { letterSpacing: -0.7 }, p(...pad)]}>
    {children}
  </Txt>
);

export function Activity({ w }: { w: Wallet }) {
  return (
    <Scroll>
      <PageTitle pad={[22, 20, 4]}>Aktivität</PageTitle>
      <View style={{ marginHorizontal: 16, marginBottom: 130 }}>
        {w.activity.map((a) => (
          <View key={a.id}>
            {a.showHeader && <Overline style={p(18, 4, 6)}>{a.day}</Overline>}
            <Btn onPress={a.onClick} style={[styles.row, { gap: 13 }, p(12, 4)]} hoverStyle={styles.rowHover}>
              <View style={[styles.center, { width: 42, height: 42, borderRadius: 21, backgroundColor: '#141418' }]}>{a.icon}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={f(800, 15)}>{a.title}</Txt>
                <Txt numberOfLines={1} style={[f(800, 12), { marginTop: 3, color: MUTED }]}>
                  {a.sub}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt style={[f(800, 14.5), { color: a.amtInk }, TNUM]}>{a.amt}</Txt>
                <View style={[{ marginTop: 4, backgroundColor: a.stBg, borderRadius: 6 }, p(2, 6)]}>
                  <Txt style={[f(800, 10.5), { color: a.stInk }]}>{a.status}</Txt>
                </View>
              </View>
            </Btn>
          </View>
        ))}
      </View>
    </Scroll>
  );
}

export function TxDetail({ w }: { w: Wallet }) {
  const tx = w.tx;
  return (
    <Screen>
      <Header onBack={w.back}>
        <HeaderTitle>Transaktion</HeaderTitle>
      </Header>
      <View style={[{ alignItems: 'center' }, p(26, 20, 10)]}>
        <View style={[styles.center, { width: 64, height: 64, borderRadius: 32, backgroundColor: '#141418' }]}>{tx.icon}</View>
        <Txt style={[f(900, 30), { marginTop: 16, letterSpacing: 0.3, color: tx.amtInk }, TNUM]}>{tx.amt}</Txt>
        <Txt style={[f(800, 13.5), { marginTop: 6, color: MUTED }]}>{tx.title}</Txt>
      </View>
      <View style={{ marginTop: 10, marginHorizontal: 16 }}>
        <KvRows rows={w.txRows} pad={[12, 4]} numeric={false} />
      </View>
      <Cta>
        <BigBtn variant="secondary" onPress={w.openExplorer} style={{ height: 58 }} textStyle={f(800, 15.5)}>
          Im Explorer ansehen
        </BigBtn>
      </Cta>
    </Screen>
  );
}

const Group = ({ label, first, children }: { label: string; first?: boolean; children: ReactNode }) => (
  <>
    <Overline style={first ? p(14, 20, 6) : p(20, 20, 6)}>{label}</Overline>
    <View style={styles.group}>
      {Children.toArray(children).map((child, i) => (
        <View key={i} style={i > 0 ? styles.groupDivider : null}>
          {child}
        </View>
      ))}
    </View>
  </>
);

const ItemBody = ({ label, value }: { label: string; value: string }) => (
  <>
    <Txt style={f(800, 15)}>{label}</Txt>
    <Txt style={[f(800, 15), { color: MUTED }]}>{value}</Txt>
  </>
);

const Item = ({ label, value, onClick }: { label: string; value: string; onClick: () => void }) => (
  <Btn onPress={onClick} style={styles.settingsRow}>
    <ItemBody label={label} value={value} />
  </Btn>
);

export function Settings({ w }: { w: Wallet }) {
  return (
    <Scroll contentStyle={{ paddingBottom: 120 }}>
      <PageTitle pad={[22, 20, 8]}>Einstellungen</PageTitle>
      <Group label="ALLGEMEIN" first>
        <Item label="Währung" value={w.currency} onClick={w.cycleCur} />
        <Item label="Netzwerke & RPC" value="8 aktiv" onClick={w.goRpc} />
        <Item label="Token verwalten" value="Leere ausgeblendet" onClick={w.tokensInfo} />
      </Group>
      <Group label="SICHERHEIT">
        <Item label="PIN ändern" value="6 Ziffern" onClick={w.changePin} />
        <Item label="Auto-Sperre" value={w.autoLockLabel} onClick={w.cycleLock} />
        <Item label="Jetzt sperren" value="›" onClick={w.lockNow} />
      </Group>
      <Group label="BACKUP">
        <Item label="Wiederherstellungsphrase anzeigen" value="PIN" onClick={w.revealPhrase} />
      </Group>
      <Group label="ÜBER">
        <Item label="Datenschutz" value="Kein Tracking" onClick={w.privacyInfo} />
        <View style={styles.settingsRow}>
          <ItemBody label="Version" value="0.1 (MVP)" />
        </View>
      </Group>
      <View style={p(22, 16, 0)}>
        <Btn onPress={w.openReset} style={[styles.center, { height: 54, borderRadius: 20, backgroundColor: 'rgba(255,143,128,.1)' }]}>
          <Txt style={[f(900, 15), { color: NEG }]}>Wallet zurücksetzen</Txt>
        </Btn>
      </View>
    </Scroll>
  );
}

export function Rpc({ w }: { w: Wallet }) {
  const extra = useBottomExtra();
  return (
    <Screen>
      <Header onBack={w.back}>
        <HeaderTitle>Netzwerke &amp; RPC</HeaderTitle>
      </Header>
      <Txt style={[f(700, 13, 1.55), { color: MUTED, marginTop: 16, marginHorizontal: 20, marginBottom: 6 }]}>
        Anbieter sehen deine IP-Adresse und abgefragte Adressen. Eigene Endpunkte verbessern die Privatsphäre. Nur HTTPS.
      </Txt>
      <ScrollView style={{ flex: 1, marginTop: 6, marginHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {w.rpcs.map((r) => (
          <View key={r.net} style={[styles.row, { gap: 12, borderTopWidth: 1, borderTopColor: r.divider }, p(12, 4)]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: POS }} />
            <View style={{ flex: 1 }}>
              <Txt style={f(800, 15)}>{r.net}</Txt>
              <Txt style={[f(800, 12), { marginTop: 3, color: MUTED }]}>{r.url}</Txt>
            </View>
            <Txt style={[f(800, 11.5), { color: MUTED }]}>{r.fb}</Txt>
          </View>
        ))}
      </ScrollView>
      <View style={p(12, 16, 34 + extra)}>
        <BigBtn variant="secondary" onPress={w.addRpc} style={{ height: 56 }} textStyle={f(800, 15.5)}>
          Eigenen Endpunkt hinzufügen
        </BigBtn>
      </View>
    </Screen>
  );
}

export function Reveal({ w }: { w: Wallet }) {
  return (
    <Screen>
      <Header onBack={w.back}>
        <HeaderTitle>Wiederherstellungsphrase</HeaderTitle>
      </Header>
      <View style={[{ marginTop: 16, marginHorizontal: 16, borderRadius: 18, backgroundColor: 'rgba(255,143,128,.1)' }, p(14, 16)]}>
        <Txt style={[f(800, 13.5, 1.45), { color: '#FFB9AE' }]}>Wer die Wörter kennt, besitzt das Geld. Zeige sie niemandem, auch nicht dem Support.</Txt>
      </View>
      <View style={{ marginTop: 14, marginHorizontal: 16 }}>
        <WordGrid words={w.revealWords} cell={11} cellBg="#141418" />
      </View>
      <Txt style={[f(800, 12), { color: '#A79BFF' }, p(12, 20, 0)]}>{PHRASE_BADGES.join(' · ')}</Txt>
      <Cta>
        <PrimaryCta onClick={w.closeReveal}>Fertig</PrimaryCta>
      </Cta>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  rowHover: { backgroundColor: 'rgba(255,255,255,.03)' },
  group: { marginHorizontal: 16, borderRadius: 22, backgroundColor: '#0E0E11', overflow: 'hidden' },
  groupDivider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.06)' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...p(15, 16) },
});
