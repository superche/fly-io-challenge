const send = (src, dest, body) => {
  const msg = {
    src,
    dest,
    body,
  }

  console.warn('Sending', msg)
  console.log(JSON.stringify(msg))
}

exports.send = send
