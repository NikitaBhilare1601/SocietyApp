import { Member } from './backend/src/models';

async function checkDatabase() {
  try {
    const count = await Member.count();
    console.log('--- DATABASE STATUS ---');
    console.log(`TOTAL_MEMBERS: ${count}`);
    
    const members = await Member.findAll({ limit: 10, order: [['id', 'DESC']] });
    console.log('--- LAST 10 MEMBERS ---');
    members.forEach(m => {
      console.log(`MEMBER_ID: ${m.id}, NAME: ${m.name}, SOCIETY_ID: ${m.societyId}, STATUS: ${m.status}`);
    });
    
    const societiesWithMembers = await Member.findAll({
      attributes: ['societyId', [Member.sequelize!.fn('COUNT', 'id'), 'count']],
      group: ['societyId']
    });
    console.log('--- COUNTS BY SOCIETY ---');
    societiesWithMembers.forEach((s: any) => {
      console.log(`SOCIETY_ID: ${s.societyId}, COUNT: ${s.get('count')}`);
    });

    const { Society } = await import('./backend/src/models');
    const societyCount = await Society.count();
    console.log(`TOTAL_SOCIETIES: ${societyCount}`);
    const societies = await Society.findAll();
    societies.forEach(s => {
      console.log(`- ID: ${s.id}, Name: ${s.name}`);
    });
    
    const { Log } = await import('./backend/src/models');
    const logs = await Log.findAll({ 
      where: { action: ['import', 'bulk_create'] },
      limit: 10,
      order: [['id', 'DESC']]
    });
    console.log('--- RECENT IMPORT LOGS ---');
    logs.forEach(l => {
      console.log(`LOG_ID: ${l.id}, ACTION: ${l.action}, NAME: ${l.entityName}, SOCIETY: ${l.societyId}, CREATED: ${l.createdAt}`);
    });

    console.log('--- END STATUS ---');

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit();
  }
}

checkDatabase();
