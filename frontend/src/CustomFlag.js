import React from 'react';
import Flag from "react-world-flags";

const CustomFlag = ({ code }) => {
  const customFlags = {
    EN: "/flags/england.png",
    ST: "/flags/scotland.png",
    WA: "/flags/wales.png",
    NT: "/flags/northern_ireland.png",
  };

  if (customFlags[code]) {
    return <img src={customFlags[code]} alt={`Flag of ${code}`} className="custom-flag" style={{ width: "20px", marginRight: "10px" }} />;
  }

  return <Flag code={code} className="custom-flag" style={{ width: "20px", marginRight: "10px" }} />;
};

export default CustomFlag;