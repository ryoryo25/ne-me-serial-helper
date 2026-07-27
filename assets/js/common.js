/**
 * common.js — シングル横断で使う共通ユーティリティ
 *
 * グローバル変数 window.SerialHelper に関数を公開する。
 */
;(function () {
  'use strict'

  function q(id) { return document.getElementById(id) }

  // Prefecture name -> code mapping (1..47)
  const PREF_MAP = {
    '北海道': 1,'青森県': 2,'岩手県': 3,'宮城県': 4,'秋田県': 5,'山形県': 6,'福島県': 7,'茨城県': 8,'栃木県': 9,'群馬県': 10,'埼玉県': 11,'千葉県': 12,'東京都': 13,'神奈川県': 14,'新潟県': 15,'富山県': 16,'石川県': 17,'福井県': 18,'山梨県': 19,'長野県': 20,'岐阜県': 21,'静岡県': 22,'愛知県': 23,'三重県': 24,'滋賀県': 25,'京都府': 26,'大阪府': 27,'兵庫県': 28,'奈良県': 29,'和歌山県': 30,'鳥取県': 31,'島根県': 32,'岡山県': 33,'広島県': 34,'山口県': 35,'徳島県': 36,'香川県': 37,'愛媛県': 38,'高知県': 39,'福岡県': 40,'佐賀県': 41,'長崎県': 42,'熊本県': 43,'大分県': 44,'宮崎県': 45,'鹿児島県': 46,'沖縄県': 47
  }

  function prefNameToCode(name) {
    if (!name) return ''
    if (typeof name === 'number') return name
    const n = (name || '').trim()
    return PREF_MAP[n] || ''
  }

  function genderToCode(g) {
    if (!g) return ''
    const s = (g || '').trim()
    if (s === '男') return 1
    if (s === '女') return 2
    return ''
  }

  function isValidSerial(s) {
    return /^[A-Za-z0-9]{8}$/.test((s || '').trim())
  }

  /** 郵便番号から住所を自動入力する */
  async function lookupZip() {
    const zip1 = q('zip1')
    const zip2 = q('zip2')
    const prefecture = q('prefecture')
    const address = q('address')
    if (!zip1 || !zip2 || !prefecture || !address) return
    const z1 = (zip1.value || '').replace(/\D/g, '')
    const z2 = (zip2.value || '').replace(/\D/g, '')
    if (z1.length < 3 || z2.length < 4) return
    const zipcode = z1 + z2
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`)
      const data = await res.json()
      if (data && data.results && data.results.length) {
        const r = data.results[0]
        prefecture.value = r.address1 || ''
        // fill the rest of the address (city + town + others) — no space between address2 and address3
        address.value = ((r.address2 || '') + (r.address3 || '')).trim()
      } else {
        prefecture.value = ''
        address.value = ''
      }
    } catch (e) {
      console.error('ZIP lookup error', e)
    }
  }

  /** 郵便番号入力欄にイベントリスナーを設定する */
  function setupZipInputs() {
    const zip1 = q('zip1')
    const zip2 = q('zip2')
    const lookupBtn = q('zip-lookup')

    if (zip1) {
      zip1.addEventListener('input', () => {
        zip1.value = zip1.value.replace(/\D/g, '')
        if (zip1.value.length >= 3) {
          zip1.value = zip1.value.slice(0, 3)
          if (zip2) zip2.focus()
        }
      })
    }

    if (zip2) {
      zip2.addEventListener('input', () => {
        zip2.value = zip2.value.replace(/\D/g, '')
        if (zip2.value.length > 4) zip2.value = zip2.value.slice(0, 4)
      })
      zip2.addEventListener('blur', lookupZip)
      zip2.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); lookupZip() } })
    }

    if (lookupBtn) lookupBtn.addEventListener('click', lookupZip)
  }

  /** fieldset 内のラジオボタンをすべて未選択にする */
  function clearCheckedRadios(fieldset) {
    if (!fieldset) return
    const radios = fieldset.querySelectorAll('input[type="radio"]')
    radios.forEach(r => { r.checked = false })
  }

  // 公開
  window.SerialHelper = {
    q,
    prefNameToCode,
    genderToCode,
    isValidSerial,
    lookupZip,
    setupZipInputs,
    clearCheckedRadios
  }
})()
