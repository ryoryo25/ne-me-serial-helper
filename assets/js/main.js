document.addEventListener('DOMContentLoaded', () => {
  function q(id){return document.getElementById(id)}

  const zip1 = q('zip1')
  const zip2 = q('zip2')
  const lookupBtn = q('zip-lookup')
  const prefecture = q('prefecture')
  const address = q('address')
  const preview = q('preview')

  // Prefecture name -> code mapping (1..47)
  const PREF_MAP = {
    '北海道': 1,'青森県': 2,'岩手県': 3,'宮城県': 4,'秋田県': 5,'山形県': 6,'福島県': 7,'茨城県': 8,'栃木県': 9,'群馬県': 10,'埼玉県': 11,'千葉県': 12,'東京都': 13,'神奈川県': 14,'新潟県': 15,'富山県': 16,'石川県': 17,'福井県': 18,'山梨県': 19,'長野県': 20,'岐阜県': 21,'静岡県': 22,'愛知県': 23,'三重県': 24,'滋賀県': 25,'京都府': 26,'大阪府': 27,'兵庫県': 28,'奈良県': 29,'和歌山県': 30,'鳥取県': 31,'島根県': 32,'岡山県': 33,'広島県': 34,'山口県': 35,'徳島県': 36,'香川県': 37,'愛媛県': 38,'高知県': 39,'福岡県': 40,'佐賀県': 41,'長崎県': 42,'熊本県': 43,'大分県': 44,'宮崎県': 45,'鹿児島県': 46,'沖縄県': 47
  }

  function prefNameToCode(name){
    if(!name) return ''
    if(typeof name === 'number') return name
    const n = (name || '').trim()
    return PREF_MAP[n] || ''
  }

  function genderToCode(g){
    if(!g) return ''
    const s = (g||'').trim()
    if(s === '男') return 1
    if(s === '女') return 2
    return ''
  }

  async function lookupZip(){
    if(!zip1 || !zip2 || !prefecture || !address) return
    const z1 = (zip1.value||'').replace(/\D/g,'')
    const z2 = (zip2.value||'').replace(/\D/g,'')
    if(z1.length<3 || z2.length<4) return
    const zipcode = z1 + z2
    try{
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`)
      const data = await res.json()
      if(data && data.results && data.results.length){
        const r = data.results[0]
        prefecture.value = r.address1 || ''
        // fill the rest of the address (city + town + others) — no space between address2 and address3
        address.value = ((r.address2 || '') + (r.address3 || '')).trim()
      } else {
        // not found
        prefecture.value = ''
        address.value = ''
      }
    }catch(e){
      console.error('ZIP lookup error', e)
    }
  }

  if(zip1){
    zip1.addEventListener('input', ()=>{
      zip1.value = zip1.value.replace(/\D/g,'')
      if(zip1.value.length>=3){
        zip1.value = zip1.value.slice(0,3)
        if(zip2) zip2.focus()
      }
    })
  }

  if(zip2){
    zip2.addEventListener('input', ()=>{
      zip2.value = zip2.value.replace(/\D/g,'')
      if(zip2.value.length>4) zip2.value = zip2.value.slice(0,4)
    })
    zip2.addEventListener('blur', lookupZip)
    zip2.addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); lookupZip() } })
  }

  if(lookupBtn) lookupBtn.addEventListener('click', lookupZip)

  if(preview){
    preview.addEventListener('click', ()=>{
      const form = document.getElementById('serial-form')
      if(!form) return
      const data = {
        serials: (q('serial') && q('serial').value) || '',
        present: (form.querySelector('input[name="present"]:checked') || {}).value || '',
        email: (q('email') && q('email').value) || '',
        name: (q('name') && q('name').value) || '',
        name_kana: (q('name_kana') && q('name_kana').value) || '',
        age: (q('age') && q('age').value) || '',
        gender: genderToCode((form.querySelector('input[name="gender"]:checked') || {}).value || ''),
        zip1: (q('zip1') && q('zip1').value) || '',
        zip2: (q('zip2') && q('zip2').value) || '',
        prefecture: prefNameToCode((q('prefecture') && q('prefecture').value) || ''),
        address: (q('address') && q('address').value) || '',
        tel1: (q('tel1') && q('tel1').value) || '',
        tel2: (q('tel2') && q('tel2').value) || '',
        tel3: (q('tel3') && q('tel3').value) || '',
        agree: (q('agree') && q('agree').checked) ? '1' : ''
      }
      // simple preview
      alert(JSON.stringify(data, null, 2))
      console.log('form preview', data)
    })
  }

  // send sequence
  const startBtn = q('start-send')
  const stopBtn = q('stop-send')
  const statusEl = q('send-status')
  let stopRequested = false

  function setButtonsRunning(running){
    if(startBtn) startBtn.disabled = running
    if(stopBtn) stopBtn.disabled = !running
  }

  async function sleep(ms){ return new Promise(resolve=>setTimeout(resolve, ms)) }

  async function sendSequence(){
    const form = document.getElementById('serial-form')
    if(!form) return
    const raw = (q('serial') && q('serial').value) || ''
    const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    if(lines.length===0){ alert('シリアルが入力されていません'); return }

    const endpoint = (q('endpoint') && q('endpoint').value || '').trim()
    const doSend = (q('do-send') && q('do-send').checked) || false
    const delay = parseInt((q('delay') && q('delay').value) || '0', 10) || 0

    statusEl.innerHTML = ''
    stopRequested = false
    setButtonsRunning(true)

    for(let i=0;i<lines.length;i++){
      if(stopRequested) break
      const serial = lines[i]
      const entry = document.createElement('div')
      entry.textContent = `送信中: ${serial}`
      statusEl.appendChild(entry)

      const payload = {
        __commit: '登録 →',
        __search_e_19871: '',
        e_19870: serial,
        e_19890: (form.querySelector('input[name="present"]:checked') || {}).value || '',
        e_19879: '',
        e_19893: '',
        e_19894: '',
        e_19895: '',
        e_19877: (q('email') && q('email').value) || '',
        e_19874: (q('name') && q('name').value) || '',
        e_19880: (q('name_kana') && q('name_kana').value) || '',
        e_19876: (q('age') && q('age').value) || '',
        e_19889: genderToCode((form.querySelector('input[name="gender"]:checked') || {}).value || ''),
        'e_19871[zip1]': (q('zip1') && q('zip1').value) || '',
        'e_19871[zip2]': (q('zip2') && q('zip2').value) || '',
        e_19872: prefNameToCode((q('prefecture') && q('prefecture').value) || ''),
        e_19873: (q('address') && q('address').value) || '',
        'e_19875[tel1]': (q('tel1') && q('tel1').value) || '',
        'e_19875[tel2]': (q('tel2') && q('tel2').value) || '',
        'e_19875[tel3]': (q('tel3') && q('tel3').value) || '',
        'e_19888[value][]': (q('agree') && q('agree').checked) ? '1' : '',
        e_19891: '',
        e_19892: '',
        __name: '',
        f: '2744',
      }

      if(doSend && endpoint){
        try{
          const res = await fetch(endpoint, {method:'POST', body: new URLSearchParams(payload), redirect: 'follow'})
          let msg = res.ok ? `成功: ${serial} (HTTP ${res.status})` : `失敗: ${serial} (HTTP ${res.status})`
          if(res.redirected){
            msg += ` → リダイレクト先: ${res.url}`
          }
          // show a short snippet of the response body for debugging
          try{
            const text = await res.text()
            if(text && text.trim()){
              const snippet = text.trim().replace(/\s+/g,' ').slice(0,30)
              msg += `\nレスポンス: ${snippet}${text.length>30? '…': ''}`
            }
          }catch(_){ /* ignore body read errors */ }
          entry.textContent = msg
        }catch(e){
          entry.textContent = `エラー: ${serial} (${e.message})`
        }
      } else {
        // simulate
        entry.textContent = `シミュレーション: ${serial}`
      }

      await sleep(delay)
    }

    setButtonsRunning(false)
    if(stopRequested) statusEl.appendChild(document.createElement('div')).textContent = '途中で停止しました'
    else statusEl.appendChild(document.createElement('div')).textContent = '送信が完了しました'
  }

  if(startBtn) startBtn.addEventListener('click', ()=>{ stopRequested = false; sendSequence() })
  if(stopBtn) stopBtn.addEventListener('click', ()=>{ stopRequested = true; setButtonsRunning(false) })

})
