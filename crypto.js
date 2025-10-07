// crypto.js
// funciones de cifrado/descifrado (implementadas para el cliente)
// NOTA: esto es ofuscación/encapsulado para el cliente; no es criptografía fuerte.

(function(window){
  // decode base64 -> string
  function base64Decode(s){ return atob(s); }

  // caesar shift back by n (aplica sobre bytes-as-characters)
  function caesarDecode(s, shift){
    // shift backward
    return Array.from(s).map(ch => String.fromCharCode((ch.charCodeAt(0)-shift+256)%256)).join('');
  }

  // xor decode: payload is base64 of xor bytes; key is ASCII
  function xorDecode(base64payload, key){
    const bytes = Uint8Array.from(atob(base64payload), c => c.charCodeAt(0));
    const k = Array.from(key).map(c=>c.charCodeAt(0));
    const out = bytes.map((b,i)=> b ^ k[i % k.length]);
    return String.fromCharCode(...out);
  }

  // helper: reverse apply layers array.
  // layers is array like ["xor","caesar","base64"], payload is string, meta may contain keyName and caesarShift
  function decodeLayers(payload, layers, meta){
    // process inverse: start from first in layers but apply inverse sequence (last->first)
    let cur = payload;
    for(let i = layers.length-1; i>=0; i--){
      const L = layers[i];
      if(L === "base64"){
        cur = base64Decode(cur);
      } else if(L === "caesar"){
        const shift = (meta && meta.caesarShift) ? meta.caesarShift : 3;
        cur = caesarDecode(cur, shift);
      } else if(L === "xor"){
        // need key name in meta
        const keyName = (meta && meta.keyName) ? meta.keyName : null;
        const key = keyName ? (window.CIPHER_KEYS && window.CIPHER_KEYS[keyName]) : null;
        if(!key) throw new Error("xor key not found for "+keyName);
        cur = xorDecode(cur, key);
      } else {
        throw new Error("Layer not supported: "+L);
      }
    }
    return cur;
  }

  // Expose
  window.CryptoLayer = {
    decodeLayers,
    // small utilities for admin: to encode on client (useful for testing)
    _encodeForTest: function(plain, layers, meta){
      // naive encode (inverse of decode): apply in forward order: base64 -> caesar(+shift) -> xor(+key)
      let cur = plain;
      for(let i=0;i<layers.length;i++){
        const L = layers[i];
        if(L==="base64"){
          cur = btoa(cur);
        } else if(L==="caesar"){
          const shift = (meta && meta.caesarShift)?meta.caesarShift:3;
          cur = Array.from(cur).map(ch => String.fromCharCode((ch.charCodeAt(0)+shift)%256)).join('');
        } else if(L==="xor"){
          const keyName = (meta && meta.keyName)?meta.keyName:null;
          const key = keyName ? (window.CIPHER_KEYS && window.CIPHER_KEYS[keyName]) : null;
          if(!key) throw new Error("xor key not found for encode test: "+keyName);
          // xor produce bytes then base64
          const kb = Array.from(key).map(c=>c.charCodeAt(0));
          const sb = Array.from(cur).map(c=>c.charCodeAt(0));
          const out = sb.map((b,i)=> b ^ kb[i%kb.length]);
          cur = btoa(String.fromCharCode(...out));
        }
      }
      return cur;
    }
  };

  // KEYS: define here the keys referenced by links (editable)
  // To increase separation, you can move some key fragments to another script file.
  window.CIPHER_KEYS = {
    // key names referenced from data.json
    "linkKey1": "MyKey",      // example
    "linkKey2": "Key123",     // example
    // add more keys as needed
  };

})(window);
