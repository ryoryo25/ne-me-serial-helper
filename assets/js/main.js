document.addEventListener('DOMContentLoaded', () => {
  function q(id){return document.getElementById(id)}

  const zip1 = q('zip1')
  const zip2 = q('zip2')
  const lookupBtn = q('zip-lookup')
  const prefecture = q('prefecture')
  const address = q('address')
  const preview = q('preview')

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
        gender: (form.querySelector('input[name="gender"]:checked') || {}).value || '',
        zipcode: ((q('zip1')&&q('zip1').value)||'') + '-' + ((q('zip2')&&q('zip2').value)||''),
        prefecture: (q('prefecture') && q('prefecture').value) || '',
        address: (q('address') && q('address').value) || '',
        tel: ((q('tel1')&&q('tel1').value)||'') + '-' + ((q('tel2')&&q('tel2').value)||'') + '-' + ((q('tel3')&&q('tel3').value)||'')
      }
      // simple preview
      alert(JSON.stringify(data, null, 2))
      console.log('form preview', data)
    })
  }
})
