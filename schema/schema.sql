BEGIN TRANSACTION;
CREATE TABLE parameters (
  name varchar(255) NOT NULL PRIMARY KEY,
  value varchar(255) NOT NULL
);
CREATE TABLE url (
  url text NOT NULL PRIMARY KEY,
  domain varchar(255),
  crawler_rank integer,
  calculated integer,
  last_read date,
  intrinsic_trustworthiness integer
);
CREATE TABLE link (
  src text NOT NULL REFERENCES url (url),
  dst text NOT NULL REFERENCES url (url),
  crawler_blessing integer,
  calculated integer,
  last_read date,
  PRIMARY KEY (src, dst)
);
INSERT INTO parameters (name, value) VALUES ( 'version', '1');
COMMIT;
