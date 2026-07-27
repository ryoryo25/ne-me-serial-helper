/**
 * form-engine.js — フォームエンジン
 *
 * HTML 内の <script id="single-config" type="application/json"> から
 * シングル固有の設定を読み取り、以下の機能を提供する:
 *   - 申込期限による選択肢の非表示
 *   - プレゼント番号変更時の条件付き fieldset 表示/非表示
 *   - フォームプレビュー（確認ボタン）
 *   - curl スクリプト生成 & コピー
 *
 * 設定の形式:
 * {
 *   "formNameMap": {
 *     "serial": "e_XXXXX",
 *     "present": "e_XXXXX",
 *     "email": "e_XXXXX",
 *     ...
 *   },
 *   "fixedValues": {
 *     "__search_e_XXXXX": "",
 *     "f": "XXXX"
 *   },
 *   "defaultEndpoint": "https://...",
 *   "conditionalFieldsets": {
 *     "2": "noime-kai-venue1-fieldset",
 *     "4": "kosatsu-member-fieldset",
 *     "5": "sign-poster-member-fieldset"
 *   }
 * }
 */
;(function () {
  'use strict'

  const { q, prefNameToCode, genderToCode, isValidSerial, setupZipInputs, clearCheckedRadios } = window.SerialHelper

  document.addEventListener('DOMContentLoaded', () => {
    // ── 設定の読み込み ──
    const configEl = document.getElementById('single-config')
    if (!configEl) {
      console.error('form-engine: <script id="single-config"> が見つかりません')
      return
    }
    const config = JSON.parse(configEl.textContent)
    const formNameMap = config.formNameMap || {}
    const fixedValues = config.fixedValues || {}
    const defaultEndpoint = config.defaultEndpoint || ''
    const conditionalFieldsets = config.conditionalFieldsets || {}

    // おそらくシングル関係ない固定値
    const commonFixedValues = {
      '__commit': '登録 →',
      '__name': '',
    }

    // ── 郵便番号入力の設定 ──
    setupZipInputs()

    // ── 申込期限制御 ──
    const presentFieldset = q('present-fieldset')
    if (presentFieldset) {
      const now = new Date()
      const labels = presentFieldset.querySelectorAll('label[data-deadline]')
      let hiddenCount = 0
      labels.forEach(label => {
        const deadline = new Date(label.dataset.deadline)
        if (now >= deadline) {
          label.style.display = 'none'
          hiddenCount++
        }
      })
      // すべての選択肢が期限切れの場合、fieldset自体を非表示
      if (hiddenCount === labels.length && labels.length > 0) {
        presentFieldset.hidden = true
      }
    }

    // ── 条件付き fieldset の表示/非表示 ──
    // conditionalFieldsets の全 fieldset ID を収集
    const allConditionalIds = [...new Set(Object.values(conditionalFieldsets))]

    if (presentFieldset && allConditionalIds.length > 0) {
      presentFieldset.addEventListener('change', (event) => {
        const v = (event.target && event.target.value) || ''
        const targetId = conditionalFieldsets[v] || null

        allConditionalIds.forEach(id => {
          const fs = q(id)
          if (!fs) return
          fs.hidden = (id !== targetId)
          clearCheckedRadios(fs)
        })
      })
    }

    // ── フォームからの値収集 ──
    function collectFormValues() {
      const form = document.getElementById('serial-form')
      if (!form) return null

      const values = {}
      for (const [key, _formName] of Object.entries(formNameMap)) {
        if (key === 'serial') {
          values[key] = (q('serial') && q('serial').value) || ''
        } else if (key === 'present') {
          values[key] = (form.querySelector('input[name="present"]:checked') || {}).value || ''
        } else if (key === 'gender') {
          values[key] = genderToCode((form.querySelector('input[name="gender"]:checked') || {}).value || '')
        } else if (key === 'prefecture') {
          values[key] = prefNameToCode((q('prefecture') && q('prefecture').value) || '')
        } else if (key === 'agree') {
          values[key] = (q('agree') && q('agree').checked) ? '1' : ''
        } else {
          // name が radio の場合と input id の場合を両方試す
          const radio = form.querySelector(`input[name="${key}"]:checked`)
          if (radio) {
            values[key] = radio.value || ''
          } else {
            const el = q(key)
            values[key] = (el && el.value) || ''
          }
        }
      }
      return values
    }

    // ── シリアルのバリデーション ──
    function validateSerials() {
      const raw = (q('serial') && q('serial').value) || ''
      const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      const textarea = q('serial')
      if (lines.length === 0) {
        if (textarea) textarea.classList.add('invalid')
        alert('シリアルが入力されていません')
        return null
      }
      const invalid = lines.filter(l => !isValidSerial(l))
      if (invalid.length) {
        if (textarea) textarea.classList.add('invalid')
        alert('以下のシリアルは無効です（8桁の英数字のみ）：\n' + invalid.join('\n'))
        return null
      }
      if (textarea) textarea.classList.remove('invalid')
      return lines
    }

    // ── 確認ボタン ──
    const previewBtn = q('preview')
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const lines = validateSerials()
        if (!lines) return
        const values = collectFormValues()
        if (!values) return
        alert(JSON.stringify(values, null, 2))
        console.log('form preview', values)
      })
    }

    // ── curl スクリプト生成 ──
    const generateBtn = q('generate-curl')
    const copyBtn = q('copy-curl')
    const curlOutput = q('curl-output')
    const copyMsg = q('copy-message')

    function generateCurlCommands() {
      const lines = validateSerials()
      if (!lines) return

      const values = collectFormValues()
      if (!values) return

      const endpoint = (q('endpoint') && q('endpoint').value || '').trim() || defaultEndpoint

      const baseParams = new URLSearchParams()

      // 共通固定値
      for (const [k, v] of Object.entries(commonFixedValues)) {
        baseParams.append(k, v)
      }

      // シングル固有固定値
      for (const [k, v] of Object.entries(fixedValues)) {
        baseParams.append(k, v)
      }

      // フォーム値 (serial 以外)
      for (const [key, formName] of Object.entries(formNameMap)) {
        if (key === 'serial') continue
        baseParams.append(formName, values[key] || '')
      }

      const serialKey = formNameMap['serial']
      const baseParamStr = baseParams.toString()
      const serialListStr = lines.map(s => `  "${s}"`).join('\n')

      const script = `#!/bin/bash

# 入力されたシリアルナンバー一覧
SERIALS=(
${serialListStr}
)

ENDPOINT='${endpoint}'
SERIAL_KEY='${serialKey}'
BASE_PARAMS='${baseParamStr}'

for serial in "\${SERIALS[@]}"; do
  echo "送信中: \${serial}"
  curl -X POST "\${ENDPOINT}" \\
    -L \\
    -H 'Content-Type: application/x-www-form-urlencoded' \\
    -d "\${SERIAL_KEY}=\${serial}&\${BASE_PARAMS}"
  echo -e "\\n----------------------------------------"
  sleep 10
done
`

      if (curlOutput) curlOutput.value = script
      if (copyBtn) copyBtn.disabled = false
      if (copyMsg) copyMsg.textContent = ''
    }

    if (generateBtn) generateBtn.addEventListener('click', generateCurlCommands)
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!curlOutput || !curlOutput.value) return
        try {
          await navigator.clipboard.writeText(curlOutput.value)
          if (copyMsg) copyMsg.textContent = 'クリップボードにコピーしました！'
        } catch (e) {
          curlOutput.select()
          document.execCommand('copy')
          if (copyMsg) copyMsg.textContent = 'クリップボードにコピーしました！'
        }
      })
    }
  })
})()
