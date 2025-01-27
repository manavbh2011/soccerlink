import React from 'react';
import Flag from "react-world-flags";

const CustomFlag = ({ code, className }) => {
  const customFlags = {
    EN: "/flags/england.png",
    ST: "/flags/scotland.png",
    WA: "/flags/wales.png",
    NT: "/flags/northern_ireland.png",
  };

  if (customFlags[code]) {
    return <img src={customFlags[code]} alt={`Flag of ${code}`} className={className} style={{ width: "20px", marginRight: "10px" }} />;
  }

  return <Flag code={code} className={className} style={{ width: "20px", marginRight: "10px" }} />;
};

export default CustomFlag;