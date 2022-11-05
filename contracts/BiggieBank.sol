//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@rari-capital/solmate/src/tokens/ERC721.sol";

contract BiggieBank is ERC721, Ownable {
  using SafeMath for uint256;
  
  uint256 public MAX_ELEMENTS = 10000;

  uint256 public PRICE = 0 ether;
  bool public locked = false;

  uint256 private _counter;

  bool private PAUSE = false;

  address public payoutAddress;
  string public baseTokenURI;

  event PauseEvent(bool pause);
  event WelcomeToBiggieBank(uint256 indexed id);

  constructor(string memory _defaultBaseURI, address _payoutAddress) ERC721("BiggieBank", "BB") {
    setBaseURI(_defaultBaseURI);
    setPayoutAddress(_payoutAddress);
  }

  /**
    * @dev Returns whether `tokenId` exists.
    *
    * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
    *
    * Tokens start existing when they are minted (`_mint`),
    * and stop existing when they are burned (`_burn`).
    */
  function _exists(uint256 tokenId) internal view virtual returns (bool) {
    return _ownerOf[tokenId] != address(0);
  }

  /**
    * @dev Returns whether `spender` is allowed to manage `tokenId`.
    *
    * Requirements:
    *
    * - `tokenId` must exist.
    */
  function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
    require(_exists(tokenId), "ERC721: operator query for nonexistent token");
    address owner = _ownerOf[tokenId];
    return (spender == owner || getApproved[tokenId] == spender || isApprovedForAll[owner][spender]);
  }

  /**
  * @dev Throws if the contract is already locked
  */
  modifier notLocked() {
    require(!locked, "Contract already locked.");
    _;
  }

  modifier saleIsOpen {
    require(_totalSupply() <= MAX_ELEMENTS, "Soldout!");
    require(!PAUSE, "Sales not open");
    _;
  }

  function setBaseURI(string memory _baseTokenURI) public onlyOwner notLocked {
    baseTokenURI = _baseTokenURI;
  }

  function setPayoutAddress(address _payoutAddress) public onlyOwner {
    payoutAddress = _payoutAddress;
  }

  function setMaxElements(uint256 _maxElements) public onlyOwner {
    require(_maxElements >= totalSupply(), 'max elements below current supply');
    MAX_ELEMENTS = _maxElements;
  }

  function _baseURI() internal view virtual returns (string memory) {
    return baseTokenURI;
  }

  /**
  * @dev Returns the tokenURI if exists
  * See {IERC721Metadata-tokenURI} for more details.
  */
  function tokenURI(uint256 _tokenId) public view virtual override(ERC721) returns (string memory) {
    return getTokenURI(_tokenId);
  }

  function getTokenURI(uint256 _tokenId) public view returns (string memory) {
    require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");
    require(_tokenId <= _totalSupply(), "ERC721Metadata: URI query for nonexistent token");
    string memory base = baseTokenURI;

    bytes memory dataURI = abi.encodePacked(
        '{',
            '"name": "BiggieBank #', Strings.toString(_tokenId), '",',
            '"description": "On chain piggy banks",',
            '"image": "', base, 'piggy.png",',
            '"animation_url": "', base, 'piggy.glb",',
        '}'
    );

    return string(
        abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(dataURI)
        )
    );
  }

  function _totalSupply() internal view returns (uint) {
    // return _tokenIds.current();
    return _counter;
  }

  function totalSupply() public view returns (uint256) {
    return _totalSupply();
  }

  /**
   * @dev See {IERC721Enumerable-tokenByIndex
   */
  function tokenByIndex(uint256 index) public view virtual returns (uint256) {
    require(_exists(index), "approved query for nonexistent token");
    return index;
  }

  /**
  * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
  */
  function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256 token) {
      require(index < _balanceOf[owner], "owner index out of bounds");
      uint256 count;
      for (uint256 i; i < _counter; i++) {
        if (_ownerOf[i] == owner) {
          if (count == index) return i;
          else count++;
        }
      }
      require(false, "owner index out of bounds");
  }

  function mint(uint _count, address _to) public payable saleIsOpen {
    require(_totalSupply() + _count <= MAX_ELEMENTS, "Max limit reached");
    require(msg.value >= price(_count), "Value below price");

    for (uint256 i; i < _count; i++) {
      _safeMint(_to, _counter);
      _counter++;

      emit WelcomeToBiggieBank(_counter - 1);
    }
  }

  function burn(uint256 tokenId) public virtual {
    //solhint-disable-next-line max-line-length
    require(_isApprovedOrOwner(_msgSender(), tokenId), "caller is not owner nor approved");
    _burn(tokenId);
  }

  function price(uint256 _count) public view returns (uint256) {
    return PRICE.mul(_count);
  }

  function setPause(bool _pause) public onlyOwner {
    PAUSE = _pause;
    emit PauseEvent(PAUSE);
  }

  /**
  * @dev Sets the prices for minting - in case of cataclysmic price movements
  */
  function setPrice(uint256 _price) external onlyOwner notLocked {
    require(_price >= 0, "Invalid prices.");
    PRICE = _price;
  }

  function withdrawAll() public onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0);
    _widthdraw(payoutAddress, address(this).balance);
  }

  function _widthdraw(address _address, uint256 _amount) private {
    (bool success, ) = _address.call{value: _amount}("");
    require(success, "Transfer failed.");
  }

  /**
  * @dev locks the contract (prevents changing the metadata base uris)
  */
  function lock() public onlyOwner notLocked {
    require(bytes(baseTokenURI).length > 0, "Thou shall not lock prematurely!");
    require(_totalSupply() == MAX_ELEMENTS, "Not all BiggyBanks are minted yet!");
    locked = true;
  }

  /**
  * @dev Do not allow renouncing ownership
  */
  function renounceOwnership() public override(Ownable) onlyOwner {}
}
