import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// OrganizaJá - projeto acadêmico de controle de despesas pessoais.
const STORAGE_KEY = '@organizaja:v2';
const COLORS = {
  green: '#176B52',
  greenDark: '#11513F',
  greenLight: '#E5F2EC',
  background: '#F5F7F5',
  surface: '#FFFFFF',
  text: '#1D2923',
  muted: '#718078',
  border: '#E3EAE5',
  danger: '#B84D43',
  orange: '#C47B35',
};

const CATEGORIES = [
  { name: 'Alimentação', icon: '🛒' },
  { name: 'Transporte', icon: '🚌' },
  { name: 'Moradia', icon: '🏠' },
  { name: 'Lazer', icon: '🎮' },
  { name: 'Saúde', icon: '💊' },
  { name: 'Educação', icon: '📚' },
  { name: 'Outros', icon: '📌' },
];

const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

function parseMoney(text) {
  let normalized = String(text || '')
    .trim()
    .replace(/\s/g, '')
    .replace(/R\$/gi, '');
  // Aceita tanto o formato brasileiro (1.234,56) quanto o decimal (1234.56).
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  return Number(normalized);
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dateLabel(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Data não informada';
  return d.toLocaleDateString('pt-BR');
}

function currentMonthLabel() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function categoryIcon(category) {
  return CATEGORIES.find((item) => item.name === category)?.icon || '📌';
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(1500);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('Início');

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alimentação');
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetText, setBudgetText] = useState('1500,00');
  const [searchText, setSearchText] = useState('');
  const [historyCategory, setHistoryCategory] = useState('Todas');

  useEffect(() => {
    async function loadData() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (Array.isArray(data.expenses)) setExpenses(data.expenses);
          if (Number.isFinite(Number(data.budget))) setBudget(Number(data.budget));
        }
      } catch (error) {
        Alert.alert('Não foi possível carregar os dados', 'O aplicativo será aberto sem os dados salvos.');
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, budget })).catch(() => {
      Alert.alert('Atenção', 'Não foi possível salvar os dados neste momento.');
    });
  }, [expenses, budget, isLoaded]);

  const thisMonthExpenses = useMemo(
    () => expenses.filter((item) => monthKey(item.createdAt) === monthKey(new Date())),
    [expenses]
  );

  const monthTotal = useMemo(
    () => thisMonthExpenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [thisMonthExpenses]
  );

  const available = budget - monthTotal;
  const usedPercent = budget > 0 ? Math.min((monthTotal / budget) * 100, 100) : 0;

  const categoryTotals = useMemo(() => {
    return CATEGORIES.map((category) => ({
      ...category,
      total: thisMonthExpenses
        .filter((item) => item.category === category.name)
        .reduce((sum, item) => sum + Number(item.amount), 0),
    })).filter((item) => item.total > 0);
  }, [thisMonthExpenses]);

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase('pt-BR');
    return [...expenses]
      .filter((item) => historyCategory === 'Todas' || item.category === historyCategory)
      .filter((item) => !query || item.description.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [expenses, searchText, historyCategory]);

  function openNewExpense() {
    setEditingId(null);
    setDescription('');
    setAmountText('');
    setSelectedCategory('Alimentação');
    setExpenseModalVisible(true);
  }

  function openEditExpense(item) {
    setEditingId(item.id);
    setDescription(item.description);
    setAmountText(String(item.amount).replace('.', ','));
    setSelectedCategory(item.category);
    setExpenseModalVisible(true);
  }

  function saveExpense() {
    const cleanDescription = description.trim();
    const value = parseMoney(amountText);

    if (cleanDescription.length < 2) {
      Alert.alert('Descrição inválida', 'Informe uma descrição com pelo menos 2 caracteres.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || value > 10000000) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero. Exemplo: 45,90.');
      return;
    }

    if (editingId) {
      setExpenses((current) => current.map((item) =>
        item.id === editingId
          ? { ...item, description: cleanDescription, amount: value, category: selectedCategory }
          : item
      ));
    } else {
      const newExpense = {
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        description: cleanDescription,
        amount: value,
        category: selectedCategory,
        createdAt: new Date().toISOString(),
      };
      setExpenses((current) => [newExpense, ...current]);
    }
    setExpenseModalVisible(false);
  }

  function confirmDelete(item) {
    Alert.alert('Excluir despesa', `Deseja excluir "${item.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setExpenses((current) => current.filter((expense) => expense.id !== item.id)),
      },
    ]);
  }

  function openBudgetEditor() {
    setBudgetText(String(budget).replace('.', ','));
    setBudgetModalVisible(true);
  }

  function saveBudget() {
    const value = parseMoney(budgetText);
    if (!Number.isFinite(value) || value <= 0 || value > 100000000) {
      Alert.alert('Orçamento inválido', 'Informe um orçamento mensal maior que zero.');
      return;
    }
    setBudget(value);
    setBudgetModalVisible(false);
  }

  function ExpenseRow({ item }) {
    return (
      <View style={styles.expenseRow}>
        <View style={styles.categoryIconBox}>
          <Text style={styles.categoryEmoji}>{categoryIcon(item.category)}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseName} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.expenseMeta}>{item.category} · {dateLabel(item.createdAt)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>{money(item.amount)}</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={() => openEditExpense(item)} accessibilityLabel={`Editar ${item.description}`}>
              <Text style={styles.editAction}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item)} accessibilityLabel={`Excluir ${item.description}`}>
              <Text style={styles.deleteAction}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function EmptyState({ title, message }) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🧾</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
      </View>
    );
  }

  function Header() {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CONTROLE FINANCEIRO PESSOAL</Text>
          <Text style={styles.brand}>OrganizaJá.</Text>
        </View>
        <View style={styles.headerMark}><Text style={styles.headerMarkText}>OJ</Text></View>
      </View>
    );
  }

  function HomeScreen() {
    return (
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>Olá! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Veja como estão suas finanças neste mês.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>TOTAL GASTO NO MÊS</Text>
            <Text style={styles.monthPill}>{currentMonthLabel()}</Text>
          </View>
          <Text style={styles.summaryAmount}>{money(monthTotal)}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottom}>
            <View>
              <Text style={styles.summarySmall}>Orçamento</Text>
              <Text style={styles.summaryValue}>{money(budget)}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summarySmall}>Disponível</Text>
              <Text style={[styles.summaryValue, available < 0 && styles.overBudgetText]}>{money(available)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Resumo do orçamento</Text>
          <TouchableOpacity onPress={openBudgetEditor}><Text style={styles.textLink}>Editar limite</Text></TouchableOpacity>
        </View>
        <View style={styles.card}>
          <View style={styles.progressHeading}>
            <Text style={styles.cardTitle}>Orçamento utilizado</Text>
            <Text style={styles.progressPercent}>{usedPercent.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${usedPercent}%`, backgroundColor: usedPercent >= 90 ? COLORS.orange : COLORS.green }]} />
          </View>
          <Text style={styles.helperText}>
            {available >= 0
              ? `Você ainda pode gastar ${money(available)} neste mês.`
              : `Você passou ${money(Math.abs(available))} do orçamento mensal.`}
          </Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Despesas recentes</Text>
          <TouchableOpacity onPress={() => setActiveTab('Histórico')}><Text style={styles.textLink}>Ver histórico</Text></TouchableOpacity>
        </View>
        {thisMonthExpenses.length > 0 ? (
          thisMonthExpenses.slice(0, 4).map((item) => <ExpenseRow key={item.id} item={item} />)
        ) : (
          <EmptyState title="Nenhuma despesa por enquanto" message="Toque no botão abaixo para registrar seu primeiro gasto." />
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={openNewExpense}>
          <Text style={styles.primaryButtonText}>＋  Adicionar despesa</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Organização financeira começa com pequenos registros.</Text>
      </ScrollView>
    );
  }

  function HistoryScreen() {
    return (
      <View style={styles.listPage}>
        <Text style={styles.pageTitle}>Histórico de despesas</Text>
        <Text style={styles.pageSubtitle}>Consulte, edite ou remova seus lançamentos.</Text>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por descrição..."
          placeholderTextColor="#9AA69F"
          style={styles.searchInput}
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['Todas', ...CATEGORIES.map((item) => item.name)].map((name) => (
            <TouchableOpacity key={name} onPress={() => setHistoryCategory(name)} style={[styles.filterChip, historyCategory === name && styles.filterChipActive]}>
              <Text style={[styles.filterText, historyCategory === name && styles.filterTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.resultCount}>{filteredExpenses.length} lançamento(s)</Text>
        {filteredExpenses.length > 0 ? (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ExpenseRow item={item} />}
            contentContainerStyle={styles.historyListContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState title="Nenhum resultado encontrado" message="Tente mudar a busca ou selecionar outra categoria." />
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={openNewExpense}>
          <Text style={styles.primaryButtonText}>＋  Nova despesa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function BudgetScreen() {
    return (
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Meu orçamento</Text>
        <Text style={styles.pageSubtitle}>Acompanhe seu limite e seus gastos de {currentMonthLabel()}.</Text>
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>LIMITE MENSAL DEFINIDO</Text>
          <Text style={styles.budgetBig}>{money(budget)}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={openBudgetEditor}>
            <Text style={styles.secondaryButtonText}>Alterar orçamento</Text>
          </TouchableOpacity>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetLine}><Text style={styles.budgetLineLabel}>Total gasto</Text><Text style={styles.budgetLineValue}>{money(monthTotal)}</Text></View>
          <View style={styles.budgetLine}><Text style={styles.budgetLineLabel}>Valor disponível</Text><Text style={[styles.budgetLineValue, available < 0 && styles.dangerText]}>{money(available)}</Text></View>
          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFill, { width: `${usedPercent}%`, backgroundColor: usedPercent >= 90 ? COLORS.orange : COLORS.green }]} />
          </View>
          <Text style={styles.helperText}>{usedPercent.toFixed(0)}% do orçamento utilizado.</Text>
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Gastos por categoria</Text></View>
        <View style={styles.card}>
          {categoryTotals.length > 0 ? categoryTotals.map((item) => {
            const percent = monthTotal > 0 ? (item.total / monthTotal) * 100 : 0;
            return (
              <View key={item.name} style={styles.categorySummary}>
                <View style={styles.categorySummaryTop}>
                  <Text style={styles.categorySummaryName}>{item.icon}  {item.name}</Text>
                  <Text style={styles.categorySummaryValue}>{money(item.total)}</Text>
                </View>
                <View style={styles.categoryTrack}><View style={[styles.categoryFill, { width: `${percent}%` }]} /></View>
              </View>
            );
          }) : <Text style={styles.helperText}>As categorias aparecerão aqui quando você cadastrar despesas.</Text>}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header />
      <View style={styles.screenArea}>
        {!isLoaded ? (
          <View style={styles.loading}><Text style={styles.loadingText}>Carregando seus dados...</Text></View>
        ) : activeTab === 'Início' ? <HomeScreen /> : activeTab === 'Histórico' ? <HistoryScreen /> : <BudgetScreen />}
      </View>

      <View style={styles.bottomNav}>
        {[
          { name: 'Início', icon: '⌂' },
          { name: 'Histórico', icon: '▤' },
          { name: 'Orçamento', icon: '◷' },
        ].map((tab) => (
          <TouchableOpacity key={tab.name} style={styles.navItem} onPress={() => setActiveTab(tab.name)}>
            <Text style={[styles.navIcon, activeTab === tab.name && styles.navActive]}>{tab.icon}</Text>
            <Text style={[styles.navLabel, activeTab === tab.name && styles.navActive]}>{tab.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={expenseModalVisible} transparent animationType="slide" onRequestClose={() => setExpenseModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Editar despesa' : 'Nova despesa'}</Text>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex.: Compra no mercado"
              placeholderTextColor="#9AA69F"
              style={styles.input}
              maxLength={50}
              returnKeyType="next"
            />
            <Text style={styles.fieldLabel}>Valor (R$)</Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="Ex.: 45,90"
              placeholderTextColor="#9AA69F"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Categoria</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  onPress={() => setSelectedCategory(category.name)}
                  style={[styles.categoryOption, selectedCategory === category.name && styles.categoryOptionSelected]}
                >
                  <Text style={[styles.categoryOptionText, selectedCategory === category.name && styles.categoryOptionTextSelected]}>
                    {category.icon}  {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={saveExpense}>
              <Text style={styles.primaryButtonText}>{editingId ? 'Salvar alterações' : 'Salvar despesa'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setExpenseModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={budgetModalVisible} transparent animationType="fade" onRequestClose={() => setBudgetModalVisible(false)}>
        <View style={styles.centeredModalBackdrop}>
          <View style={styles.budgetModalCard}>
            <Text style={styles.modalTitle}>Definir orçamento</Text>
            <Text style={styles.fieldLabel}>Quanto pretende gastar por mês?</Text>
            <TextInput
              value={budgetText}
              onChangeText={setBudgetText}
              placeholder="1500,00"
              placeholderTextColor="#9AA69F"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={saveBudget}>
              <Text style={styles.primaryButtonText}>Salvar orçamento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setBudgetModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 9, letterSpacing: 1.4, color: COLORS.muted, fontWeight: '800' },
  brand: { fontSize: 27, fontWeight: '900', color: COLORS.text, letterSpacing: -0.7 },
  headerMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  headerMarkText: { color: COLORS.green, fontWeight: '900', fontSize: 14 },
  screenArea: { flex: 1 },
  pageContent: { paddingHorizontal: 20, paddingBottom: 25 },
  welcomeBlock: { marginTop: 5, marginBottom: 17 },
  welcomeTitle: { color: COLORS.text, fontSize: 23, fontWeight: '900' },
  welcomeSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  summaryCard: { backgroundColor: COLORS.green, borderRadius: 21, padding: 19, shadowColor: COLORS.greenDark, shadowOpacity: 0.13, shadowRadius: 10, elevation: 3 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: '#D3E9DE', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  monthPill: { color: '#E5F3EB', backgroundColor: '#FFFFFF20', fontSize: 9, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, textTransform: 'capitalize' },
  summaryAmount: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', marginTop: 10, letterSpacing: -0.7 },
  summaryDivider: { height: 1, backgroundColor: '#FFFFFF35', marginVertical: 16 },
  summaryBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryRight: { alignItems: 'flex-end' },
  summarySmall: { color: '#D3E9DE', fontSize: 10 },
  summaryValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 4 },
  overBudgetText: { color: '#FFD4C9' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 11 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  textLink: { color: COLORS.green, fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, padding: 16 },
  progressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  progressPercent: { color: COLORS.green, fontSize: 12, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: '#EAF0EC', borderRadius: 10, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: 8, borderRadius: 10 },
  helperText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 10 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, padding: 11, marginBottom: 8 },
  categoryIconBox: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#EFF5F1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  categoryEmoji: { fontSize: 18 },
  expenseInfo: { flex: 1, minWidth: 0 },
  expenseName: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  expenseMeta: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end', marginLeft: 7 },
  expenseAmount: { color: COLORS.text, fontSize: 11, fontWeight: '900' },
  rowActions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  editAction: { color: COLORS.green, fontSize: 9, fontWeight: '800' },
  deleteAction: { color: COLORS.danger, fontSize: 9, fontWeight: '800' },
  primaryButton: { backgroundColor: COLORS.green, borderRadius: 14, minHeight: 49, alignItems: 'center', justifyContent: 'center', marginTop: 13, paddingHorizontal: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  footerText: { textAlign: 'center', color: '#98A49D', fontSize: 9, marginTop: 16, marginBottom: 8 },
  emptyState: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 25, alignItems: 'center', marginTop: 3 },
  emptyIcon: { fontSize: 28 },
  emptyTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginTop: 9, textAlign: 'center' },
  emptyMessage: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 5, textAlign: 'center' },
  listPage: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  pageTitle: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  pageSubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 14 },
  searchInput: { height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 13, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 12 },
  filterRow: { paddingVertical: 12, gap: 7 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDF2EE', borderWidth: 1, borderColor: '#EDF2EE' },
  filterChipActive: { backgroundColor: COLORS.greenLight, borderColor: '#A8CFBA' },
  filterText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: COLORS.green, fontWeight: '900' },
  resultCount: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginBottom: 8 },
  historyListContent: { paddingBottom: 10 },
  bottomNav: { height: 65, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 3 },
  navItem: { minWidth: 75, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#9AA69F', fontSize: 20 },
  navLabel: { color: '#9AA69F', fontSize: 9, fontWeight: '700', marginTop: 2 },
  navActive: { color: COLORS.green, fontWeight: '900' },
  budgetBig: { color: COLORS.text, fontSize: 29, fontWeight: '900', marginTop: 6 },
  cardEyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  secondaryButton: { borderWidth: 1, borderColor: COLORS.green, borderRadius: 11, paddingVertical: 11, alignItems: 'center', marginTop: 14 },
  secondaryButtonText: { color: COLORS.green, fontSize: 11, fontWeight: '900' },
  budgetDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  budgetLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  budgetLineLabel: { color: COLORS.muted, fontSize: 11 },
  budgetLineValue: { color: COLORS.text, fontSize: 11, fontWeight: '900' },
  dangerText: { color: COLORS.danger },
  progressTrackLarge: { height: 9, backgroundColor: '#EAF0EC', borderRadius: 10, overflow: 'hidden', marginTop: 3 },
  categorySummary: { marginBottom: 15 },
  categorySummaryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  categorySummaryName: { color: COLORS.text, fontSize: 11, fontWeight: '700' },
  categorySummaryValue: { color: COLORS.text, fontSize: 11, fontWeight: '900' },
  categoryTrack: { height: 6, backgroundColor: '#EDF2EE', borderRadius: 10, overflow: 'hidden' },
  categoryFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 10 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#101B1680' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 21, paddingTop: 12, paddingBottom: 25 },
  modalHandle: { width: 38, height: 4, borderRadius: 4, backgroundColor: '#DCE4DE', alignSelf: 'center', marginBottom: 17 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', marginBottom: 13 },
  fieldLabel: { color: '#526158', fontSize: 11, fontWeight: '800', marginTop: 10, marginBottom: 7 },
  input: { height: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, paddingHorizontal: 12, color: COLORS.text, fontSize: 13, backgroundColor: '#FCFDFC' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  categoryOption: { borderWidth: 1, borderColor: '#EDF1EE', backgroundColor: '#F3F6F4', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 20 },
  categoryOptionSelected: { backgroundColor: COLORS.greenLight, borderColor: '#A8CFBA' },
  categoryOptionText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  categoryOptionTextSelected: { color: COLORS.green, fontWeight: '900' },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
  cancelButtonText: { color: COLORS.muted, fontSize: 11, fontWeight: '800' },
  centeredModalBackdrop: { flex: 1, backgroundColor: '#101B1680', justifyContent: 'center', padding: 22 },
  budgetModalCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 21 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.muted, fontSize: 12 },
});
