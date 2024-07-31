import FormData from "form-data";
import Jimp from "jimp";

async function processing(urlPath, method) {
	return new Promise(async (resolve, reject) => {
		let Methods = ["enhance", "recolor", "dehaze"];
		Methods.includes(method) ? (method = method) : (method = Methods[0]);
		let buffer,
			Form = new FormData(),
			scheme = "https" + "://" + "inferenceengine" + ".vyro" + ".ai/" + method;
		Form.append("model_version", 1, {
			"Content-Transfer-Encoding": "binary",
			contentType: "multipart/form-data; charset=uttf-8",
		});
		Form.append("image", Buffer.from(urlPath), {
			filename: "enhance_image_body.jpg",
			contentType: "image/jpeg",
		});
		Form.submit(
			{
				url: scheme,
				host: "inferenceengine" + ".vyro" + ".ai",
				path: "/" + method,
				protocol: "https:",
				headers: {
					"User-Agent": "okhttp/4.9.3",
					Connection: "Keep-Alive",
					"Accept-Encoding": "gzip",
				},
			},
			function (err, res) {
				if (err) reject();
				let data = [];
				res
					.on("data", function (chunk, resp) {
						data.push(chunk);
					})
					.on("end", () => {
						resolve(Buffer.concat(data));
					});
				res.on("error", (e) => {
					reject();
				});
			}
		);
	});
}
let handler = async (m, { conn, usedPrefix, command }) => {
	switch (command) {
		case "enhancer":
		case "unblur":
		case "enhance":
			{
				conn.enhancer = conn.enhancer ? conn.enhancer : {};
				if (m.sender in conn.enhancer)
					throw "Wait for one image to be processed.";
				let q = m.quoted ? m.quoted : m;
				let mime = (q.msg || q).mimetype || q.mediaType || "";
				if (!mime)
					throw `Enter the command along with the image`;
				if (!/image\/(jpe?g|png)/.test(mime))
					throw ` ${mime} Doesnot Support`;
				else conn.enhancer[m.sender] = true;
				m.reply(wait);
				let img = await q.download?.();
				let error;
				try {
					const This = await processing(img, "enhance");
					conn.sendFile(m.chat, This, "shizo.img", maker, m);
				} catch (er) {
					error = true;
				} finally {
					if (error) {
						m.reply("Disconnected from server");
					}
					delete conn.enhancer[m.sender];
				}
			}
			break;
		case "colorize":
		case "colorizer":
			{
				conn.recolor = conn.recolor ? conn.recolor : {};
				if (m.sender in conn.recolor)
					throw "Wait for one image to be processed";
				let q = m.quoted ? m.quoted : m;
				let mime = (q.msg || q).mimetype || q.mediaType || "";
				if (!mime)
					throw `Enter the command along with image`;
				if (!/image\/(jpe?g|png)/.test(mime))
					throw `${mime} is not editable`;
				else conn.recolor[m.sender] = true;
				m.reply(wait);
				let img = await q.download?.();
				let error;
				try {
					const This = await processing(img, "enhance");
					conn.sendFile(m.chat, This, "shizo.img", maker, m);
				} catch (er) {
					error = true;
				} finally {
					if (error) {
						m.reply("Disconnected from server");
					}
					delete conn.recolor[m.chat];
				}
			}
			break;
		case "hd":
		case "hdr":
			{
				conn.hdr = conn.hdr ? conn.hdr : {};
				if (m.sender in conn.hdr)
					throw "Wait to be processed one image then add another one dude";
				let q = m.quoted ? m.quoted : m;
				let mime = (q.msg || q).mimetype || q.mediaType || "";
				if (!mime)
					throw `Enter the Command Along with image`;
				if (!/image\/(jpe?g|png)/.test(mime))
					throw `${mime} Doesnot Editable`;
				else conn.hdr[m.sender] = true;
				m.reply(wait);
				let img = await q.download?.();
				let error;
				try {
					const This = await processing(img, "enhance");
					conn.sendFile(m.chat, This, "shizo.img", maker, m);
				} catch (er) {
					error = true;
				} finally {
					if (error) {
						m.reply("Server Disconnected");
					}
					delete conn.hdr[m.sender];
				}
			}
			break;
	}
};
handler.help = ['hd', 'hdr', 'unblur', 'remblur', 'colorize', 'colorizer', 'enhance', 'enhancer','dehaze','recolor' ,'enhance']
handler.tags = ["image", "maker"];
handler.command = ['hd', 'hdr', 'unblur', 'remblur', 'colorize', 'colorizer', 'enhance', 'enhancer','dehaze','recolor' ,'enhance']
export default handler;
      
      
