
import { en, es, id, pt, ar } from '../language/index.js'

export async function before(m,{ conn }) {

	let lang = global.db.data.users[m.sender].language
	
  let translations
   if (lang === "es") {
      translations = es
     } else if (lang === "en") {
      translations = en
     } else if (lang === "id") {
      translations = id
     } else if (lang === "pt") {
      translations = pt
      } else if (lang === "ar") {
      translations = ar
     } else {
      translations = en
     }

	global.mssg = translations
	
}
