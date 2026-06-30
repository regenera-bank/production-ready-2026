import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { colors, spacing, radius, typography } from '../../../theme';

export default function ProfileScreen() {
  const [biometrics, setBiometrics] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const SECTIONS = [
    {
      title: 'CONTA',
      items: [
        { label: 'Dados pessoais' },
        { label: 'Segurança e senha' },
        { label: 'Chaves Pix' },
        { label: 'Documentos' },
      ],
    },
    {
      title: 'PREFERÊNCIAS',
      items: [
        { label: 'Biometria', toggle: biometrics, onToggle: setBiometrics },
        { label: 'Notificações push', toggle: pushNotif, onToggle: setPushNotif },
        { label: 'Tema escuro', toggle: darkMode, onToggle: setDarkMode },
      ],
    },
    {
      title: 'SUPORTE',
      items: [
        { label: 'Chat de suporte' },
        { label: 'Termos de uso' },
        { label: 'Política de privacidade' },
        { label: 'Sobre o app' },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.avatarBlock}>
          <View style={s.avatar}><Text style={s.avatarText}>U</Text></View>
          <Text style={s.name}>Usuário Regenera</Text>
          <Text style={s.email}>user@regenera.bank</Text>
          <View style={s.planBadge}><Text style={s.planText}>PLANO PREMIUM</Text></View>
        </View>
        {SECTIONS.map(sec => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            {sec.items.map((item, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowLabel}>{item.label}</Text>
                {'toggle' in item && item.onToggle ? (
                  <Switch value={item.toggle} onValueChange={item.onToggle}
                    trackColor={{ false: colors.border, true: colors.cyanDim }}
                    thumbColor={item.toggle ? colors.cyan : colors.textDim} />
                ) : (
                  <Text style={{ color: colors.textDim, fontSize: 18 }}>›</Text>
                )}
              </View>
            ))}
          </View>
        ))}
        <TouchableOpacity style={s.logoutBtn}>
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
        <Text style={[typography.caption, { textAlign: 'center', paddingBottom: spacing.xl }]}>
          Regenera Bank v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  avatarBlock: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.indigoDim, borderWidth: 2, borderColor: colors.indigoBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.indigo, fontSize: 32, fontWeight: '800' },
  name: { ...typography.h2 },
  email: { ...typography.body },
  planBadge: { backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  planText: { color: colors.amber, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  section: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, ...typography.body, color: colors.text, fontSize: 15 },
  logoutBtn: { margin: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)', alignItems: 'center' },
  logoutText: { color: colors.red, fontWeight: '600', fontSize: 15 },
});
