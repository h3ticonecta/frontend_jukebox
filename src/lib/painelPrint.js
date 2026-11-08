import { formatBRL } from './billing';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function money(value) {
  return formatBRL(Number(value) || 0);
}

/**
 * Monta um HTML limpo (fundo branco) do painel para impressão/PDF.
 * A exportação usa o diálogo de impressão do navegador ("Salvar como PDF").
 */
export function buildPainelPrintHtml(painel, { periodoLabel, maquinaLabel, statusLabel, usuario } = {}) {
  const resumo = painel?.resumo || {};
  const porMaquina = Array.isArray(painel?.faturamento_por_maquina)
    ? painel.faturamento_por_maquina
    : [];
  const geradoEm = new Date().toLocaleString('pt-BR');

  const rows = porMaquina
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.nome_jukebox)}</td>
        <td class="num">${money(item.faturamento_numero ?? item.faturamento)}</td>
        <td class="num">${Number(item.creditos) || 0}</td>
        <td>${item.is_active ? 'Ativa' : 'Inativa'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Painel Administrativo — Jukebox</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #555; font-size: 12px; margin-bottom: 20px; }
  .cards { display: flex; gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #ccc; border-radius: 8px; padding: 12px 16px; flex: 1; }
  .card .label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.05em; }
  .card .value { font-size: 20px; font-weight: bold; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
  th { background: #f0f0f0; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  h2 { font-size: 15px; margin: 24px 0 10px; }
</style>
</head>
<body>
  <h1>Painel Administrativo — Jukebox</h1>
  <p class="meta">
    Gerado em ${escapeHtml(geradoEm)}${usuario ? ` por ${escapeHtml(usuario)}` : ''}<br/>
    Filtros: período = ${escapeHtml(periodoLabel || 'Todo período')} · máquina = ${escapeHtml(maquinaLabel || 'Todas')} · status = ${escapeHtml(statusLabel || 'Todos')}
  </p>

  <div class="cards">
    <div class="card"><div class="label">Faturamento Total</div><div class="value">${money(resumo.faturamento_total_numero ?? resumo.faturamento_total)}</div></div>
    <div class="card"><div class="label">Créditos Vendidos</div><div class="value">${Number(resumo.creditos_vendidos) || 0}</div></div>
    <div class="card"><div class="label">Músicas Tocadas</div><div class="value">${Number(resumo.musicas_tocadas) || 0}</div></div>
    <div class="card"><div class="label">Máquinas Ativas</div><div class="value">${Number(resumo.maquinas_ativas) || 0}</div></div>
  </div>

  <h2>Faturamento por Máquina</h2>
  <table>
    <thead>
      <tr><th>Máquina</th><th>Faturamento</th><th>Créditos</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="4">Sem dados no período</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

/** Abre a janela de impressão (Salvar como PDF) com o relatório do painel. */
export function exportPainelPdf(painel, contexto) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return false;
  win.document.write(buildPainelPrintHtml(painel, contexto));
  win.document.close();
  win.focus();
  win.print();
  return true;
}
