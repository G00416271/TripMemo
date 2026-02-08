import ExifReader from 'exifreader';

document.getElementById('image').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // turn image into raw data
  const buffer = await file.arrayBuffer();

  // read EXIF
  const tags = ExifReader.load(buffer, { expanded: true });

  // print result
  console.log('EXIF tags:', tags);
});
