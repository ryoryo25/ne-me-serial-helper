document.addEventListener('DOMContentLoaded', () => {
  function q(id){return document.getElementById(id)}

  const present = q('present-fieldset')

  // 申込期限を過ぎたプレゼント選択肢を非表示にする
  if(present){
    const now = new Date()
    const labels = present.querySelectorAll('label[data-deadline]')
    let hiddenCount = 0
    labels.forEach(label => {
      const deadline = new Date(label.dataset.deadline)
      if(now >= deadline){
        label.style.display = 'none'
        hiddenCount++
      }
    })
    // すべての選択肢が期限切れの場合、fieldset自体を非表示
    if(hiddenCount === labels.length){
      present.hidden = true
    }
  }
  const noimeKaiVenue1 = q('noime-kai-venue1-fieldset')
  const noimeKaiVenue2 = q('noime-kai-venue2-fieldset')
  const kosatsuMember = q('kosatsu-member-fieldset')
  const signPosterMember = q('sign-poster-member-fieldset')

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

  function isValidSerial(s){
    return /^[A-Za-z0-9]{8}$/.test((s||'').trim())
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

  function clearCheckedRadios(fieldset){
    if(!fieldset) return
    const radios = fieldset.querySelectorAll('input[type="radio"]')
    radios.forEach(r => { r.checked = false })
  }

  if(present){
    present.addEventListener('change', (event)=>{
      const v = (event.target && event.target.value) || ''
      if(v === '2'){ // ノイミー会＠東京
        if(noimeKaiVenue1) noimeKaiVenue1.hidden = false
        if(noimeKaiVenue2) noimeKaiVenue2.hidden = true
        if(kosatsuMember) kosatsuMember.hidden = true
        if(signPosterMember) signPosterMember.hidden = true

        clearCheckedRadios(noimeKaiVenue1)
        clearCheckedRadios(noimeKaiVenue2)
        clearCheckedRadios(kosatsuMember)
        clearCheckedRadios(signPosterMember)

      } else if(v === '4'){ // ≠MEメンバー個別撮影会
        if(noimeKaiVenue1) noimeKaiVenue1.hidden = true
        if(noimeKaiVenue2) noimeKaiVenue2.hidden = true
        if(kosatsuMember) kosatsuMember.hidden = false
        if(signPosterMember) signPosterMember.hidden = true

        clearCheckedRadios(noimeKaiVenue1)
        clearCheckedRadios(noimeKaiVenue2)
        clearCheckedRadios(kosatsuMember)
        clearCheckedRadios(signPosterMember)
      } else if(v === '5'){ // ≠MEソロポスターサイン会
        if(noimeKaiVenue1) noimeKaiVenue1.hidden = true
        if(noimeKaiVenue2) noimeKaiVenue2.hidden = true
        if(kosatsuMember) kosatsuMember.hidden = true
        if(signPosterMember) signPosterMember.hidden = false

        clearCheckedRadios(noimeKaiVenue1)
        clearCheckedRadios(noimeKaiVenue2)
        clearCheckedRadios(kosatsuMember)
        clearCheckedRadios(signPosterMember)
      } else {
        // hide all
        if(noimeKaiVenue1) noimeKaiVenue1.hidden = true
        if(noimeKaiVenue2) noimeKaiVenue2.hidden = true
        if(kosatsuMember) kosatsuMember.hidden = true
        if(signPosterMember) signPosterMember.hidden = true

        clearCheckedRadios(noimeKaiVenue1)
        clearCheckedRadios(noimeKaiVenue2)
        clearCheckedRadios(kosatsuMember)
        clearCheckedRadios(signPosterMember)
      }
    })
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
      const raw = (q('serial') && q('serial').value) || ''
      const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
      const invalid = lines.filter(l => !isValidSerial(l))
      const textarea = q('serial')
      if(invalid.length){
        if(textarea) textarea.classList.add('invalid')
        alert('以下のシリアルは無効です（8桁の英数字のみ）：\n' + invalid.join('\n'))
        return
      } else {
        if(textarea) textarea.classList.remove('invalid')
      }

      const data = {
        serials: (q('serial') && q('serial').value) || '',
        present: (form.querySelector('input[name="present"]:checked') || {}).value || '',
        noime_kai_venue1: (form.querySelector('input[name="noime_kai_venue1"]:checked') || {}).value || '',
        noime_kai_venue2: (form.querySelector('input[name="noime_kai_venue2"]:checked') || {}).value || '',
        kosatsu_member: (form.querySelector('input[name="kosatsu_member"]:checked') || {}).value || '',
        sign_poster_member: (form.querySelector('input[name="sign_poster_member"]:checked') || {}).value || '',
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

  // シングル固有のフォーム名マッピング
  const formNameMap = {
    'serial': 'e_23164',
    'present': 'e_23166',
    'noime_kai_venue1': 'e_23296',
    'noime_kai_venue2': 'e_23298',
    'kosatsu_member': 'e_23300',
    'sign_poster_member': 'e_23306',
    'email': 'e_23167',
    'name': 'e_23175',
    'name_kana': 'e_23168',
    'age': 'e_23169',
    'gender': 'e_23170',
    'zip1': 'e_23171[zip1]',
    'zip2': 'e_23171[zip2]',
    'prefecture': 'e_23181',
    'address': 'e_23172',
    'tel1': 'e_23173[tel1]',
    'tel2': 'e_23173[tel2]',
    'tel3': 'e_23173[tel3]',
    'agree': 'e_23174[value][]'
  }

  // シングル固有の固定値 (おそらくフォームの値のバリデーションに使っている)
  const fixedValues = {
    '__search_e_23171': '',
    'f': '3130'
  }

  // おそらくシングル関係ない固定値
  const commonFixedValues = {
    '__commit': '登録 →',
    '__name': '',
  }

  // curl generator
  const generateBtn = q('generate-curl')
  const copyBtn = q('copy-curl')
  const curlOutput = q('curl-output')
  const copyMsg = q('copy-message')

  function generateCurlCommands(){
    const form = document.getElementById('serial-form')
    if(!form) return
    const raw = (q('serial') && q('serial').value) || ''
    const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    const textarea = q('serial')
    if(lines.length===0){
      if(textarea) textarea.classList.add('invalid')
      alert('シリアルが入力されていません')
      return
    }
    const invalid = lines.filter(l => !isValidSerial(l))
    if(invalid.length){
      if(textarea) textarea.classList.add('invalid')
      alert('以下のシリアルは無効です（8桁の英数字のみ）：\n' + invalid.join('\n'))
      return
    } else {
      if(textarea) textarea.classList.remove('invalid')
    }

    const endpoint = (q('endpoint') && q('endpoint').value || '').trim() || 'https://krs.bz/kingrecords/m/9n3e6k7'

    const baseParams = new URLSearchParams()
    baseParams.append('__commit', commonFixedValues['__commit'])
    baseParams.append('__name', commonFixedValues['__name'])
    baseParams.append('__search_e_23171', fixedValues['__search_e_23171'])
    baseParams.append('f', fixedValues['f'])

    baseParams.append(formNameMap['present'], (form.querySelector('input[name="present"]:checked') || {}).value || '')
    baseParams.append(formNameMap['noime_kai_venue1'], (form.querySelector('input[name="noime_kai_venue1"]:checked') || {}).value || '')
    baseParams.append(formNameMap['noime_kai_venue2'], (form.querySelector('input[name="noime_kai_venue2"]:checked') || {}).value || '')
    baseParams.append(formNameMap['kosatsu_member'], (form.querySelector('input[name="kosatsu_member"]:checked') || {}).value || '')
    baseParams.append(formNameMap['sign_poster_member'], (form.querySelector('input[name="sign_poster_member"]:checked') || {}).value || '')
    baseParams.append(formNameMap['email'], (q('email') && q('email').value) || '')
    baseParams.append(formNameMap['name'], (q('name') && q('name').value) || '')
    baseParams.append(formNameMap['name_kana'], (q('name_kana') && q('name_kana').value) || '')
    baseParams.append(formNameMap['age'], (q('age') && q('age').value) || '')
    baseParams.append(formNameMap['gender'], genderToCode((form.querySelector('input[name="gender"]:checked') || {}).value || ''))
    baseParams.append(formNameMap['zip1'], (q('zip1') && q('zip1').value) || '')
    baseParams.append(formNameMap['zip2'], (q('zip2') && q('zip2').value) || '')
    baseParams.append(formNameMap['prefecture'], prefNameToCode((q('prefecture') && q('prefecture').value) || ''))
    baseParams.append(formNameMap['address'], (q('address') && q('address').value) || '')
    baseParams.append(formNameMap['tel1'], (q('tel1') && q('tel1').value) || '')
    baseParams.append(formNameMap['tel2'], (q('tel2') && q('tel2').value) || '')
    baseParams.append(formNameMap['tel3'], (q('tel3') && q('tel3').value) || '')
    if (q('agree') && q('agree').checked) {
      baseParams.append(formNameMap['agree'], '1')
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

    if(curlOutput) curlOutput.value = script
    if(copyBtn) copyBtn.disabled = false
    if(copyMsg) copyMsg.textContent = ''
  }

  if(generateBtn) generateBtn.addEventListener('click', generateCurlCommands)
  if(copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if(!curlOutput || !curlOutput.value) return
      try {
        await navigator.clipboard.writeText(curlOutput.value)
        if(copyMsg) copyMsg.textContent = 'クリップボードにコピーしました！'
      } catch(e) {
        curlOutput.select()
        document.execCommand('copy')
        if(copyMsg) copyMsg.textContent = 'クリップボードにコピーしました！'
      }
    })
  }

})
