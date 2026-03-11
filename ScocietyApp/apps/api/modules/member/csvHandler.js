import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { members } from '../db/schema';
import { eq } from 'drizzle-orm';

const upload = multer({ dest: 'uploads/' });

const importCSV = (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        // Validate and insert data into the database
        for (const row of results) {
          // Example validation
          if (!row.email || !row.mobileNumber) {
            return res.status(400).send({ error: 'Invalid data in CSV' });
          }
          // Insert into database
          await members.insert({
            name: row.name,
            societyId: row.societyId,
            societyName: row.societyName,
            wingId: row.wingId,
            wingName: row.wingName,
            flatNumber: row.flatNumber,
            memberType: row.memberType,
            ownerName: row.ownerName,
            vehicleType: row.vehicleType,
            vehicleNumber: row.vehicleNumber,
            gender: row.gender,
            mobileNumber: row.mobileNumber,
            email: row.email,
            idProof: row.idProof,
          });
        }
        res.status(200).send({ message: 'CSV imported successfully' });
      } catch (error) {
        res.status(500).send({ error: 'Error importing CSV' });
      }
    });
};

const exportCSV = async (req, res) => {
  try {
    const data = await members.findMany({
      where: eq(members.societyId, req.query.societyId),
    });

    const csvData = data.map((row) => ({
      name: row.name,
      societyId: row.societyId,
      societyName: row.societyName,
      wingId: row.wingId,
      wingName: row.wingName,
      flatNumber: row.flatNumber,
      memberType: row.memberType,
      ownerName: row.ownerName,
      vehicleType: row.vehicleType,
      vehicleNumber: row.vehicleNumber,
      gender: row.gender,
      mobileNumber: row.mobileNumber,
      email: row.email,
      idProof: row.idProof,
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=members.csv');

    res.write('name,societyId,societyName,wingId,wingName,flatNumber,memberType,ownerName,vehicleType,vehicleNumber,gender,mobileNumber,email,idProof\n');
    csvData.forEach((row) => {
      res.write(
        `${row.name},${row.societyId},${row.societyName},${row.wingId},${row.wingName},${row.flatNumber},${row.memberType},${row.ownerName},${row.vehicleType},${row.vehicleNumber},${row.gender},${row.mobileNumber},${row.email},${row.idProof}\n`
      );
    });
    res.end();
  } catch (error) {
    res.status(500).send({ error: 'Error exporting CSV' });
  }
};

export { upload, importCSV, exportCSV };